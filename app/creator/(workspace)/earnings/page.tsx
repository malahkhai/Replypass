import {requireRole} from '@/lib/auth/session';
import {stripeConfig} from '@/lib/stripe/config';
import {paymentSummaries} from '@/lib/stripe/summaries';
import {SecuredEarnings} from '@/components/secured-earnings';
import { EarningsPage } from "@/components/creator-workspace";
import {serviceDatabase} from "@/lib/stripe/server";
import {Price} from "@/components/ui";
export const metadata = { title: "Earnings" };
export default async function Page() {
 const viewer=await requireRole(["creator","admin"]);
 if(!viewer.demo&&stripeConfig()){
  const db=serviceDatabase(); const {data:creator}=await db.from("creator_profiles").select("id").eq("profile_id",viewer.id).single();
  const {data:vip}=creator?await db.from("subscription_payments").select("id,gross_cents,fee_cents,creator_cents,currency,payment_kind,paid_at,subscriptions!inner(creator_id,membership_name)").eq("subscriptions.creator_id",creator.id).eq("status","paid").order("paid_at",{ascending:false}).limit(100):{data:[]};
  return <><SecuredEarnings rows={await paymentSummaries(viewer.id,"creator")}/><section className="vip-earnings"><h2>VIP membership revenue</h2>{(vip||[]).map(p=><div className="setting-row" key={p.id}><div><strong>{p.payment_kind==="initial"?"New VIP membership":"Subscription renewal"}</strong><p>Fan paid <Price cents={p.gross_cents} currency={p.currency}/> · ReplyPass <Price cents={p.fee_cents} currency={p.currency}/></p></div><strong>You earned <Price cents={p.creator_cents} currency={p.currency}/></strong></div>)}{!vip?.length&&<p>No completed VIP payments yet.</p>}</section></>;
 }
  return <EarningsPage />;
}
