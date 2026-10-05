import "server-only";
import type Stripe from "stripe";
import { vipSplit } from "./model";
import { notifyVipLifecycle } from "@/lib/notifications/vip-lifecycle";
import { stripeConfig } from "@/lib/stripe/config";

function ref(value:unknown){return typeof value==="string"?value:(value&&typeof value==="object"&&"id" in value?String((value as {id:unknown}).id):null);}
function subscriptionRef(invoice:Record<string,unknown>){
  const direct=ref(invoice.subscription); if(direct)return direct;
  const parent=invoice.parent as {subscription_details?:{subscription?:unknown}}|undefined;
  return ref(parent?.subscription_details?.subscription);
}
function periods(subscription:Record<string,unknown>){
  const item=((subscription.items as {data?:Record<string,unknown>[]}|undefined)?.data||[])[0];
  return {start:Number(subscription.current_period_start||item?.current_period_start||0),end:Number(subscription.current_period_end||item?.current_period_end||0)};
}
export const vipWebhookEvents=new Set(["checkout.session.completed","customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed"]);
export async function processVipWebhook(event:{id:string;type:string;data:Stripe.Event["data"]},db:ReturnType<typeof import("@/lib/stripe/server").serviceDatabase>,stripe:Stripe){
  const mode=stripeConfig()?.mode;
  if(!mode) throw Error("VIP webhook mode unavailable.");
  const object=event.data.object as unknown as Record<string,unknown>;
  if(event.type==="checkout.session.completed"){
    const id=String((object.metadata as Record<string,string>|null)?.replypass_membership_id||object.client_reference_id||"");
    const subscriptionId=ref(object.subscription),customerId=ref(object.customer);
    if(!id||!subscriptionId||!customerId) throw Error("Incomplete VIP checkout event.");
    const {error:bindError}=await db.from("subscriptions").update({stripe_subscription_id:subscriptionId,stripe_customer_id:customerId,updated_at:new Date().toISOString()}).eq("id",id).eq("stripe_mode",mode).select("id").single();
    if(bindError) throw Error("VIP checkout mode mismatch.");
    const sub=await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(sub as unknown as Record<string,unknown>,db,mode);
    await notifyVipLifecycle(id,"started");
    await notifyVipLifecycle(id,"creator_started");
    return;
  }
  if(event.type.startsWith("customer.subscription.")){
    await syncSubscription(object,db,mode);
    const id=String((object.metadata as Record<string,string>|null)?.replypass_membership_id||"");
    if(id&&(event.type==="customer.subscription.deleted"||object.cancel_at_period_end===true))
      await notifyVipLifecycle(id,"canceled",String(object.id));
    return;
  }
  if(event.type==="invoice.payment_failed"){
    const sid=subscriptionRef(object); if(sid) {
      const {data:membership}=await db.from("subscriptions").update({status:"past_due",updated_at:new Date().toISOString()}).eq("stripe_subscription_id",sid).eq("stripe_mode",mode).select("id").maybeSingle();
      if(membership) await notifyVipLifecycle(membership.id,"payment_issue",String(object.id));
    } return;
  }
  if(event.type==="invoice.paid"){
    const sid=subscriptionRef(object); if(!sid)return;
    const current=await stripe.subscriptions.retrieve(sid);
    await syncSubscription(current as unknown as Record<string,unknown>,db,mode);
    const {data:membership,error}=await db.from("subscriptions").select("*").eq("stripe_subscription_id",sid).eq("stripe_mode",mode).single();
    if(error||!membership) throw Error("VIP membership not found.");
    const gross=Number(object.amount_paid||0); if(!Number.isSafeInteger(gross)||gross<=0)return;
    const split=vipSplit(gross,membership.fee_bps);
    const invoiceId=String(object.id); const {count}=await db.from("subscription_payments").select("id",{count:"exact",head:true}).eq("subscription_id",membership.id).eq("status","paid");
    const {error:paymentError}=await db.from("subscription_payments").upsert({subscription_id:membership.id,stripe_invoice_id:invoiceId,stripe_payment_intent_id:ref(object.payment_intent),gross_cents:gross,fee_cents:split.feeCents,creator_cents:split.creatorCents,fee_bps:split.feeBps,currency:String(object.currency),payment_kind:(count||0)>0?"renewal":"initial",status:"paid",paid_at:new Date(Number(object.status_transitions&&typeof object.status_transitions==="object"?(object.status_transitions as Record<string,number>).paid_at:0)*1000||Date.now()).toISOString()},{onConflict:"stripe_invoice_id"});
    if(paymentError) throw Error("VIP payment ledger unavailable.");
    for(const [kind,amount] of [["charge",gross],["fee",split.feeCents],["transfer",split.creatorCents]] as const) {
      const {error:transactionError}=await db.from("transactions").upsert({subscription_id:membership.id,kind,amount_cents:amount,currency:String(object.currency),stripe_event_id:event.id,stripe_object_id:invoiceId},{onConflict:"stripe_event_id,stripe_object_id,kind",ignoreDuplicates:true});
      if(transactionError) throw Error("VIP transaction ledger unavailable.");
    }
    await notifyVipLifecycle(membership.id,"creator_payment",invoiceId);
  }
}
async function syncSubscription(subscription:Record<string,unknown>,db:ReturnType<typeof import("@/lib/stripe/server").serviceDatabase>,mode:"test"|"live"){
  const id=String((subscription.metadata as Record<string,string>|null)?.replypass_membership_id||""); if(!id)return;
  const allowed=["incomplete","active","trialing","past_due","canceled","unpaid","paused"];
  const raw=String(subscription.status),status=allowed.includes(raw)?raw:"expired",period=periods(subscription);
  const scheduledCancellation=subscription.cancel_at_period_end===true||(
    Number(subscription.cancel_at||0)>Date.now()/1000&&
    period.end>0&&Number(subscription.cancel_at)===period.end
  );
  const ended=Number(subscription.ended_at||0),canceled=Number(subscription.canceled_at||0);
  const {error}=await db.from("subscriptions").update({stripe_subscription_id:String(subscription.id),stripe_customer_id:ref(subscription.customer),status,current_period_start:period.start?new Date(period.start*1000).toISOString():null,current_period_end:period.end?new Date(period.end*1000).toISOString():null,cancel_at_period_end:scheduledCancellation,canceled_at:canceled?new Date(canceled*1000).toISOString():null,ended_at:ended?new Date(ended*1000).toISOString():null,updated_at:new Date().toISOString()}).eq("id",id).eq("stripe_mode",mode).select("id").single();
  if(error) throw Error("VIP state could not be synchronized.");
}
