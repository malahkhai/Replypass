import { VipComposer, type ManagedVipPost } from "@/components/vip-composer";
import { VipSettings } from "@/components/vip-settings";
import { requireRole } from "@/lib/auth/session";
import { serviceDatabase } from "@/lib/stripe/server";
import { getVipPlan } from "@/lib/vip/server";

export const metadata = { title: "VIP" };

function VipHeader() {
  return <header className="vip-page-header"><div><span className="eyebrow">YOUR INNER CIRCLE</span><h1>VIP memberships.</h1><p>Build recurring support with private posts and clear boundaries.</p></div><div className="vip-header-note"><strong>85%</strong><span>of every membership is yours</span></div></header>;
}

function VipSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="vip-page-section"><div className="vip-section-heading"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>;
}

export default async function Page() {
  const viewer = await requireRole(["creator", "admin"], "/creator/vip");
  if (viewer.demo) return <><VipHeader/><div className="vip-page-note">Demo mode previews VIP without creating billing.</div><VipSection number="01" title="Your membership" description="Choose what members receive and set the monthly price."><VipSettings initial={null}/></VipSection><VipSection number="02" title="Private posts" description="Share updates and photos with active VIP members."><VipComposer enabled={false}/></VipSection></>;
  const db = serviceDatabase();
  const { data: creator } = await db.from("creator_profiles").select("id").eq("profile_id", viewer.id).single();
  const plan = creator ? await getVipPlan(creator.id) : null;
  const [{ data: members }, { data: payments }, { data: posts }] = creator ? await Promise.all([
    db.from("subscriptions").select("status,created_at,current_period_end,creator_cents").eq("creator_id", creator.id),
    db.from("subscription_payments").select("creator_cents,paid_at,subscriptions!inner(creator_id)").eq("subscriptions.creator_id", creator.id).eq("status", "paid").gte("paid_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    db.from("vip_posts").select("id,body,published_at,vip_post_media(id)").eq("creator_id", creator.id).order("published_at", { ascending: false }).limit(20),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const active = (members || []).filter((x) => ["active", "trialing"].includes(x.status));
  const month = new Date().toISOString().slice(0, 7);
  const newThisMonth = active.filter((x) => x.created_at.startsWith(month)).length;
  const recurringRevenue = active.reduce((sum, item) => sum + Number(item.creator_cents || 0), 0);
  const revenueThisMonth = (payments || []).reduce((sum, item) => sum + Number(item.creator_cents || 0), 0);
  const cancellations = (members || []).filter((x) => x.status === "canceled").length;
  const managedPosts: ManagedVipPost[] = (posts || []).map((post) => ({ id: post.id, body: post.body, publishedAt: post.published_at, hasPhoto: Array.isArray(post.vip_post_media) ? post.vip_post_media.length > 0 : !!post.vip_post_media }));
  return <><VipHeader/><section className="vip-metrics" aria-label="VIP performance"><article className="vip-metric-primary"><span>Active VIPs</span><strong>{active.length}</strong><small>{newThisMonth} new this month</small></article><article><span>Monthly recurring revenue</span><strong>€{(recurringRevenue / 100).toFixed(2)}</strong><small>Your 85% share</small></article><article><span>Earned this month</span><strong>€{(revenueThisMonth / 100).toFixed(2)}</strong><small>Successful membership payments</small></article><article><span>Cancellations</span><strong>{cancellations}</strong><small>This membership history</small></article></section><VipSection number="01" title="Your membership" description="Choose what members receive and set the monthly price."><VipSettings initial={plan}/></VipSection><VipSection number="02" title="Private posts" description="Share updates and photos with active VIP members."><VipComposer enabled={!!plan?.enabled} initialPosts={managedPosts}/></VipSection></>;
}
