import { MarketingPage } from "@/components/marketing-page";
import { pageMetadata } from "@/lib/metadata";
import { getViewer } from "@/lib/auth/session";
import { CreatorLandingCount } from "@/components/creator-landing-count";
export const metadata = pageMetadata(
  "Create your page. Get paid for replies",
  "/",
  "Create a personal ReplyPass link, invite followers to request guaranteed replies, and earn on your terms.",
);
export default async function Home() {
  const viewer = await getViewer();
  return <><CreatorLandingCount /><MarketingPage creatorAuthenticated={viewer?.role === "creator" || viewer?.role === "admin"} /></>;
}
