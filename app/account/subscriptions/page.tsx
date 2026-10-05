import { MembershipList, type MembershipView } from "@/components/membership-list";
import { requireRole } from "@/lib/auth/session";
import { stripeConfig } from "@/lib/stripe/config";
import { serviceDatabase } from "@/lib/stripe/server";

export const metadata = {
  title: "Your memberships",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const viewer = await requireRole(["fan", "creator", "admin"], "/account/subscriptions");
  let memberships: MembershipView[] = [];

  if (!viewer.demo) {
    const mode = stripeConfig()?.mode;
    if (!mode) throw Error("Membership billing unavailable.");

    const { data, error } = await serviceDatabase()
      .from("subscriptions")
      .select("id,membership_name,amount_cents,currency,status,current_period_end,cancel_at_period_end,creator_profiles(handle,profiles!creator_profiles_profile_id_fkey(display_name,avatar_path))")
      .eq("fan_id", viewer.id)
      .eq("stripe_mode", mode)
      .order("created_at", { ascending: false });

    if (error) throw Error("Memberships unavailable.");

    memberships = (data || []).map((membership) => {
      const creator = membership.creator_profiles as unknown as {
        handle: string;
        profiles: { display_name: string; avatar_path: string | null };
      };

      return {
        id: membership.id,
        name: membership.membership_name || `${creator.profiles.display_name} VIP`,
        creatorName: creator.profiles.display_name,
        creatorHandle: creator.handle,
        creatorImage: creator.profiles.avatar_path || "",
        amountCents: membership.amount_cents,
        currency: membership.currency,
        status: membership.status,
        periodEnd: membership.current_period_end,
        cancelAtPeriodEnd: membership.cancel_at_period_end,
      };
    });
  }

  return (
    <main className="account-memberships-page">
      <div className="account-memberships-content">
        <header className="account-memberships-heading">
          <span className="eyebrow">YOUR INNER CIRCLE</span>
          <h1>Memberships</h1>
          <p>Stay close to the creators you support. Your access and billing details are here.</p>
        </header>
        <MembershipList memberships={memberships} />
      </div>
    </main>
  );
}
