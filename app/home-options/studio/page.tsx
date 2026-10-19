import { LandingOption } from "@/components/landing-options";
import { CreatorLandingCount } from "@/components/creator-landing-count";
import { getViewer } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";
import { getFeaturedMimi } from "@/lib/creators/featured";
export const metadata = pageMetadata("Studio · Your attention has value", "/home-options/studio", "A ReplyPass homepage concept for paid replies and VIP memberships.", true);
export default async function Page() {
  const [viewer, featuredCreator] = await Promise.all([getViewer(), getFeaturedMimi()]);
  return <><CreatorLandingCount/><LandingOption variant="studio" creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} featuredCreator={featuredCreator}/></>;
}
