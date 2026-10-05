import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { creatorForUser } from "@/lib/creators/repository";
import { toPublic } from "@/lib/creators/catalog";
import { creatorPublication } from "@/lib/creators/publication";
import { CreatorProfile } from "@/components/creator-profile";
import { createClient } from "@/lib/supabase/server";
import { getVipPlan } from "@/lib/vip/server";
import type { VipPlan } from "@/lib/vip/model";

export const metadata = { title: "Your private profile preview", robots: { index: false, follow: false } };
export default async function CreatorPreview() {
  const viewer = await requireRole(["creator", "admin"], "/creator/preview");
  const draft = await creatorForUser(viewer.id);
  if (!draft) redirect("/creator/apply");
  const publication = creatorPublication(draft, viewer.demo);
  const creator = toPublic(draft, false);
  let vipPlan: VipPlan | null = null;
  const db = await createClient();
  if (db && !viewer.demo) {
    const { data, error } = await db.from("creator_profiles").select("id").eq("profile_id", viewer.id).single();
    if (error) throw Error("Unable to load your preview.");
    creator.id = data.id;
    vipPlan = await getVipPlan(data.id);
  }
  creator.vip = vipPlan?.enabled ? { kind: "vip", title: "Join VIP", subtitle: vipPlan.description, cents: vipPlan.amountCents, unit: "/month", icon: "sparkles" } : null;
  return <>
    <section className="creator-preview-notice" aria-label="Private preview">
      <div><span className="eyebrow">ONLY YOU CAN SEE THIS PREVIEW</span><h1>{publication.title}</h1><p>{publication.description}</p><p>Sharing, saving and checkout are disabled in this preview.</p></div>
      <div className="creator-preview-links"><Link className="button button-secondary" href="/creator/dashboard">Back to dashboard</Link><Link className="button" href="/creator/profile">Edit profile</Link></div>
    </section>
    <CreatorProfile creator={creator} vipPlan={vipPlan} preview />
  </>;
}
