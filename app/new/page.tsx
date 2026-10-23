import { LandingOption } from "@/components/landing-options";
import { pageMetadata } from "@/lib/metadata";
import { getViewer } from "@/lib/auth/session";
import { CreatorLandingCount } from "@/components/creator-landing-count";
import { getFeaturedCreators } from "@/lib/creators/featured";
export const metadata = pageMetadata(
  "Get paid for replies your followers want",
  "/new",
  "Create a free ReplyPass page, set your price for Guaranteed Replies, offer an optional VIP membership, and share your link anywhere your followers find you.",
  true,
);
export default async function NewLandingPage() {
  const [viewer, featuredCreators] = await Promise.all([getViewer(), getFeaturedCreators()]);
  return <><CreatorLandingCount /><LandingOption variant="centered" creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} featuredCreators={featuredCreators} /></>;
}
