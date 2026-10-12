import { DashboardHome } from "@/components/creator-workspace";
import { requireRole } from "@/lib/auth/session";
import { stripeConfig } from "@/lib/stripe/config";
import { creatorPayoutOverview } from "@/lib/stripe/creator-payout-overview";
export const metadata = { title: "Dashboard" };
export default async function Page() {
  const viewer = await requireRole(["creator", "admin"]);
  let payoutOverview = null;
  if (!viewer.demo && stripeConfig()) {
    try {
      payoutOverview = await creatorPayoutOverview(viewer.id, { persistStatus: false });
    } catch {
      // The creator workspace remains usable if Stripe is temporarily unavailable.
    }
  }
  return <DashboardHome payoutOverview={payoutOverview} />;
}
