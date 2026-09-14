import "server-only";
import { paymentBackend, serviceDatabase } from "@/lib/stripe/server";
import { authOrigin, siteConfig } from "@/lib/site";
import { vipAccessEligible, vipSplit, type VipPlan } from "./model";

export async function getVipPlan(creatorId:string):Promise<VipPlan|null>{
  const db=serviceDatabase();
  const {data,error}=await db.from("creator_membership_plans").select("*").eq("creator_id",creatorId).maybeSingle();
  if(error) throw Error("VIP plan unavailable.");
  return data?{id:data.id,creatorId:data.creator_id,name:data.name,description:data.description,benefits:data.benefits,amountCents:data.amount_cents,currency:data.currency,enabled:data.enabled}:null;
}
export async function hasActiveVipAccess(fanId:string,creatorId:string){
  const db=serviceDatabase();
  const {data,error}=await db.from("subscriptions").select("status,current_period_end").eq("fan_id",fanId).eq("creator_id",creatorId).in("status",["active","trialing"]).maybeSingle();
  if(error) throw Error("Membership access unavailable.");
  return !!data&&vipAccessEligible(data.status,data.current_period_end);
}
export async function createVipCheckout(fanId:string,creatorId:string){
  const {stripe,db}=paymentBackend();
  const [planResult,creatorResult,profileResult,fanResult,existingResult]=await Promise.all([
    db.from("creator_membership_plans").select("*").eq("creator_id",creatorId).eq("enabled",true).single(),
    db.from("creator_stripe_accounts").select("stripe_account_id,ready").eq("creator_id",creatorId).single(),
    db.from("creator_profiles").select("profile_id,handle").eq("id",creatorId).single(),
    db.auth.admin.getUserById(fanId),
    db.from("subscriptions").select("*").eq("fan_id",fanId).eq("creator_id",creatorId).in("status",["incomplete","trialing","active","past_due","unpaid","paused"]).maybeSingle(),
  ]);
  const plan=planResult.data, account=creatorResult.data, creator=profileResult.data, email=fanResult.data.user?.email;
  if(planResult.error||!plan||!plan.enabled) throw Error("VIP is not available.");
  if(creatorResult.error||!account?.ready||!account.stripe_account_id) throw Error("Creator payouts are not ready.");
  if(profileResult.error||!creator) throw Error("Creator is unavailable.");
  if(creator.profile_id===fanId) throw Error("You cannot join your own membership.");
  const {data:blocks,error:blockError}=await db.from("blocks").select("id").or(`and(blocker_id.eq.${fanId},blocked_id.eq.${creator.profile_id}),and(blocked_id.eq.${fanId},blocker_id.eq.${creator.profile_id})`).limit(1);
  if(blockError) throw Error("Membership eligibility could not be verified.");
  if(blocks?.length) throw Error("Creator is unavailable.");
  if(!email) throw Error("A verified email is required.");
  if(existingResult.data){
    if(existingResult.data.stripe_customer_id) return {existing:true,url:null};
    if(existingResult.data.created_at && Date.now()-Date.parse(existingResult.data.created_at)<30*60*1000) throw Error("VIP checkout is already in progress.");
    await db.from("subscriptions").update({status:"expired",ended_at:new Date().toISOString()}).eq("id",existingResult.data.id);
  }
  let productId=plan.stripe_product_id,priceId=plan.stripe_price_id;
  if(!productId){const p=await stripe.products.create({name:plan.name,metadata:{replypass_creator_id:creatorId}});productId=p.id;}
  if(!priceId){const p=await stripe.prices.create({product:productId,unit_amount:plan.amount_cents,currency:plan.currency,recurring:{interval:"month"},metadata:{replypass_plan_id:plan.id}});priceId=p.id;}
  await db.from("creator_membership_plans").update({stripe_product_id:productId,stripe_price_id:priceId,updated_at:new Date().toISOString()}).eq("id",plan.id);
  const split=vipSplit(plan.amount_cents);
  const {data:membership,error}=await db.from("subscriptions").insert({fan_id:fanId,creator_id:creatorId,plan_id:plan.id,status:"incomplete",amount_cents:plan.amount_cents,currency:plan.currency,stripe_price_id:priceId,membership_name:plan.name,fee_bps:split.feeBps,fee_cents:split.feeCents,creator_cents:split.creatorCents}).select("id").single();
  if(error||!membership) throw Error("Could not reserve membership checkout.");
  const origin=authOrigin(siteConfig.url);
  const session=await stripe.checkout.sessions.create({mode:"subscription",customer_email:email,client_reference_id:membership.id,line_items:[{price:priceId,quantity:1}],success_url:`${origin}/vip/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/@${encodeURIComponent(creator.handle)}`,subscription_data:{application_fee_percent:15,transfer_data:{destination:account.stripe_account_id},metadata:{replypass_membership_id:membership.id,replypass_creator_id:creatorId}},metadata:{replypass_membership_id:membership.id}},{idempotencyKey:`vip-checkout-${membership.id}`});
  return {existing:false,url:session.url};
}
