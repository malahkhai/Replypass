import { LandingOption } from "@/components/landing-options";
import { pageMetadata } from "@/lib/metadata";
import { getViewer } from "@/lib/auth/session";
import { CreatorLandingCount } from "@/components/creator-landing-count";
import { getFeaturedMimi } from "@/lib/creators/featured";
export const metadata = pageMetadata(
  "Get paid for replies your followers want",
  "/",
  "Create a free ReplyPass page, set your price for Guaranteed Replies, offer an optional VIP membership, and share your link anywhere your followers find you.",
);
export default async function Home() {
  const [viewer, featuredCreator] = await Promise.all([getViewer(), getFeaturedMimi()]);
  return <><CreatorLandingCount /><LandingOption variant="studio" creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} featuredCreator={featuredCreator} /></>;
}
