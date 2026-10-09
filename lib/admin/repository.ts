import "server-only";
import { stripeConfig } from "@/lib/stripe/config";
const paymentMode = () => {
  const mode = stripeConfig()?.mode;
  if (!mode) throw Error("Financial reporting unavailable without Stripe configuration.");
  return mode;
};
import { serviceDatabase } from "@/lib/stripe/server";

export type AdminMetric = { label:string; value:string; attention?:boolean };
const money=(cents:number,currency="eur")=>new Intl.NumberFormat("en-GB",{style:"currency",currency:currency.toUpperCase()}).format(cents/100);

export async function adminOverview(){
  const db=serviceDatabase();
  const mode=paymentMode();
  const [profiles,creators,subscriptions,payments,vipPayments,reports,disputes,reconciliation]=await Promise.all([
    db.from("profiles").select("id",{count:"exact",head:true}),
    db.from("creator_profiles").select("id",{count:"exact",head:true}).eq("status","approved"),
    db.from("subscriptions").select("id,amount_cents,currency").eq("stripe_mode",mode).in("status",["active","trialing"]).gt("current_period_end",new Date().toISOString()),
    db.from("reply_payments").select("gross_cents,fee_cents,creator_cents,payment_state,transfer_state").in("payment_state",["captured","refunded","disputed"]).eq("stripe_mode",mode),
    db.from("subscription_payments").select("gross_cents,fee_cents,creator_cents,status,subscriptions!inner(stripe_mode)").eq("subscriptions.stripe_mode",mode),
    db.from("reports").select("id",{count:"exact",head:true}).in("status",["open","reviewing","escalated"]),
    db.from("stripe_disputes").select("id",{count:"exact",head:true}).not("status","in",'(won,lost,warning_closed)'),
    db.from("reconciliation_issues").select("id",{count:"exact",head:true}).in("status",["open","manual_review"]),
  ]);
  if(payments.error||vipPayments.error||subscriptions.error)throw Error("Financial totals unavailable.");
  const rows=payments.data||[];
  const vipRows=vipPayments.data||[];
  const gross=rows.reduce((n,p)=>n+(p.payment_state==="captured"?p.gross_cents:0),0)+vipRows.reduce((n,p)=>n+(p.status==="paid"?p.gross_cents:0),0);
  const fees=rows.reduce((n,p)=>n+(p.payment_state==="captured"?p.fee_cents:0),0)+vipRows.reduce((n,p)=>n+(p.status==="paid"?p.fee_cents:0),0);
  const earnings=rows.reduce((n,p)=>n+(p.payment_state==="captured"?p.creator_cents:0),0)+vipRows.reduce((n,p)=>n+(p.status==="paid"?p.creator_cents:0),0);
  const refunds=rows.reduce((n,p)=>n+(p.payment_state==="refunded"?p.gross_cents:0),0)+vipRows.reduce((n,p)=>n+(p.status==="refunded"?p.gross_cents:0),0);
  const transferFailures=rows.filter(p=>p.transfer_state==="failed").length;
  return {metrics:[
    {label:"Total users",value:String(profiles.count||0)}, {label:"Active creators",value:String(creators.count||0)},
    {label:"Active VIP subscriptions",value:String(subscriptions.data?.length||0)}, {label:"Paid requests",value:String(rows.length)},
    {label:"VIP monthly gross",value:money((subscriptions.data||[]).filter(s=>s.currency==="eur").reduce((n,s)=>n+s.amount_cents,0))},
    {label:"VIP payments",value:String(vipRows.filter(p=>p.status==="paid").length)},
    {label:"Gross payment volume",value:money(gross)}, {label:"Platform share before Stripe fees",value:money(fees)},
    {label:"Creator earnings",value:money(earnings)}, {label:"Refunds",value:money(refunds)},
    {label:"Open reports",value:String(reports.count||0),attention:!!reports.count},
    {label:"Failed transfers",value:String(transferFailures),attention:transferFailures>0},
    {label:"Disputes",value:String(disputes.count||0),attention:!!disputes.count},
    {label:"Reconciliation issues",value:String(reconciliation.count||0),attention:!!reconciliation.count},
  ] as AdminMetric[]};
}

export async function adminUsers(search=""){
  const db=serviceDatabase();
  const [{data:profiles,error},{data:auth}]=await Promise.all([
    db.from("profiles").select("id,display_name,role,account_status,created_at,suspended_at").order("created_at",{ascending:false}).limit(100),
    db.auth.admin.listUsers({page:1,perPage:100}),
  ]);
  if(error) throw Error("Users unavailable.");
  const emails=new Map((auth?.users||[]).map(user=>[user.id,user.email||""]));
  const needle=search.trim().toLowerCase();
  return (profiles||[]).map(p=>({...p,email:emails.get(p.id)||""})).filter(p=>!needle||[p.id,p.display_name,p.email,p.role].some(v=>String(v).toLowerCase().includes(needle)));
}

export async function adminCreators(){
  const db=serviceDatabase();
  const since=new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const [{data,error},{data:copyDays,error:copyError}]=await Promise.all([
    db.from("creator_profiles").select("id,profile_id,handle,status,verified,onboarding_complete,created_at,profiles!creator_profiles_profile_id_fkey(display_name,account_status),creator_stripe_accounts(ready,transfers_enabled,payouts_enabled),creator_pricing(kind,active),subscriptions(id,status),paid_interactions(id,status)").order("created_at",{ascending:false}).limit(100),
    db.from("creator_link_copy_days").select("creator_id,surface,copy_count").gte("copied_on",since),
  ]);
  if(error||(copyError&&!["42P01","PGRST205"].includes(copyError.code))) throw Error("Creators unavailable.");
  const copies=new Map<string,{dashboard:number;profile:number}>();
  for(const row of copyDays||[]){const current=copies.get(row.creator_id)||{dashboard:0,profile:0};if(row.surface==="creator_dashboard")current.dashboard+=Number(row.copy_count);else current.profile+=Number(row.copy_count);copies.set(row.creator_id,current);}
  return (data||[]).map(creator=>({...creator,linkCopies7d:copies.get(creator.id)?.dashboard||0,profileLinkCopies7d:copies.get(creator.id)?.profile||0}));
}

export async function adminPayments(mode: "test" | "live" | "unknown" = paymentMode()){
  const db=serviceDatabase();
  const {data,error}=await db.from("reply_payments").select("id,interaction_kind,gross_cents,fee_cents,creator_cents,currency,payment_state,transfer_state,stripe_payment_intent_id,stripe_charge_id,stripe_transfer_id,created_at,fan_id,creator_id,needs_reconciliation,manual_review,stripe_mode").eq("stripe_mode",mode).order("created_at",{ascending:false}).limit(100);
  if(error) throw Error("Payments unavailable."); return data||[];
}

export async function adminSubscriptions(){const db=serviceDatabase();const{data,error}=await db.from("subscriptions").select("id,fan_id,creator_id,membership_name,amount_cents,currency,status,stripe_mode,stripe_subscription_id,current_period_start,current_period_end,cancel_at_period_end,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw Error("Subscriptions unavailable.");return data||[];}
export async function adminReports(){const db=serviceDatabase();const{data,error}=await db.from("reports").select("id,reporter_id,reported_profile_id,message_id,request_id,vip_post_id,paid_media_delivery_id,reason,status,moderator_note,created_at,reviewed_at").order("created_at",{ascending:false}).limit(100);if(error)throw Error("Reports unavailable.");return data||[];}
export async function adminDisputes(){const db=serviceDatabase();const{data,error}=await db.from("stripe_disputes").select("*").order("provider_created_at",{ascending:false}).limit(100);if(error)throw Error("Disputes unavailable.");return data||[];}
export async function adminReconciliation(){const db=serviceDatabase();const{data,error}=await db.from("reconciliation_issues").select("*").order("last_checked_at",{ascending:false}).limit(100);if(error)throw Error("Reconciliation unavailable.");return data||[];}
export async function adminPayouts(){const db=serviceDatabase();const{data,error}=await db.from("payouts").select("id,creator_id,amount_cents,currency,status,stripe_payout_id,arrival_date,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw Error("Payouts unavailable.");return data||[];}

export async function auditAdmin(adminId:string,action:string,targetType:string,targetId:string,metadata:Record<string,unknown>={}){
  const safe=Object.fromEntries(Object.entries(metadata).filter(([key])=>!["token","secret","email","message","url"].includes(key)));
  const {error}=await serviceDatabase().from("admin_audit_log").insert({admin_id:adminId,action,target_type:targetType,target_id:targetId,metadata:safe});
  if(error) throw Error("Audit log unavailable.");
}
