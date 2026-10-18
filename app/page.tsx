import { LandingOption } from "@/components/landing-options";
import { pageMetadata } from "@/lib/metadata";
import { getViewer } from "@/lib/auth/session";
import { CreatorLandingCount } from "@/components/creator-landing-count";
export const metadata = pageMetadata(
  "Get paid for replies",
  "/",
  "Create a personal ReplyPass link, invite followers to request guaranteed replies, and earn on your terms.",
);
export default async function Home() {
  const viewer = await getViewer();
  return <><CreatorLandingCount /><LandingOption variant="studio" creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} showComparison={false} /></>;
}
