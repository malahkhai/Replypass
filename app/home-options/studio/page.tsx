import { LandingOption } from "@/components/landing-options";
import { CreatorLandingCount } from "@/components/creator-landing-count";
import { getViewer } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";
import { getFeaturedCreators } from "@/lib/creators/featured";
export const metadata = pageMetadata("Studio · Your attention has value", "/home-options/studio", "A ReplyPass homepage concept for paid replies and VIP memberships.", true);
export default async function Page() {
  const [viewer, featuredCreators] = await Promise.all([getViewer(), getFeaturedCreators()]);
  return <><CreatorLandingCount/><LandingOption variant="studio" creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} featuredCreators={featuredCreators}/></>;
}
