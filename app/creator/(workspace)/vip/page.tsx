import { requireRole } from "@/lib/auth/session";
import { serviceDatabase } from "@/lib/stripe/server";
import { getVipPlan } from "@/lib/vip/server";
import { VipSettings } from "@/components/vip-settings";
import { VipComposer, type ManagedVipPost } from "@/components/vip-composer";
export const metadata = { title: "VIP" };
export default async function Page() {
  const viewer = await requireRole(["creator", "admin"], "/creator/vip");
  if (viewer.demo) return <><header className="workspace-heading"><span className="eyebrow">YOUR INNER CIRCLE</span><h1>VIP memberships.</h1><p>Demo mode previews VIP without creating billing.</p></header><VipSettings initial={null}/><VipComposer enabled={false}/></>;
  const db = serviceDatabase();
  const { data: creator } = await db.from("creator_profiles").select("id").eq("profile_id", viewer.id).single();
  const plan = creator ? await getVipPlan(creator.id) : null;
  const [{ data: members }, { data: payments }, { data: posts }] = creator ? await Promise.all([
    db.from("subscriptions").select("status,created_at,current_period_end,creator_cents").eq("creator_id", creator.id),
    db.from("subscription_payments").select("creator_cents,paid_at,subscriptions!inner(creator_id)").eq("subscriptions.creator_id", creator.id).eq("status", "paid").gte("paid_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    db.from("vip_posts").select("id,body,published_at,vip_post_media(id)").eq("creator_id", creator.id).order("published_at", { ascending: false }).limit(20),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const active = (members || []).filter((x) => ["active", "trialing"].includes(x.status));
  const managedPosts: ManagedVipPost[] = (posts || []).map((post) => ({ id: post.id, body: post.body, publishedAt: post.published_at, hasPhoto: Array.isArray(post.vip_post_media) ? post.vip_post_media.length > 0 : !!post.vip_post_media }));
  return <><header className="workspace-heading"><span className="eyebrow">YOUR INNER CIRCLE</span><h1>VIP memberships.</h1><p>Recurring support and private posts, with clear boundaries.</p></header><div className="dashboard-stats"><div><span>Active VIPs</span><strong>{active.length}</strong></div><div><span>New this month</span><strong>{active.filter((x) => x.created_at.startsWith(new Date().toISOString().slice(0, 7))).length}</strong></div><div><span>Monthly recurring revenue</span><strong>€{(active.reduce((s, x) => s + Number(x.creator_cents || 0), 0) / 100).toFixed(2)}</strong></div><div><span>VIP revenue this month</span><strong>€{((payments || []).reduce((sum, item) => sum + Number(item.creator_cents || 0), 0) / 100).toFixed(2)}</strong></div><div><span>Cancellations</span><strong>{(members || []).filter((x) => x.status === "canceled").length}</strong></div></div><VipSettings initial={plan}/><VipComposer enabled={!!plan?.enabled} initialPosts={managedPosts}/></>;
}
