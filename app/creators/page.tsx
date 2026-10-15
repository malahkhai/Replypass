import { MarketingPage } from "@/components/marketing-page";
import { pageMetadata } from "@/lib/metadata";
import { getViewer } from "@/lib/auth/session";
import { CreatorLandingCount } from "@/components/creator-landing-count";
export const metadata = pageMetadata(
  "Get paid for your attention",
  "/creators",
  "Create your ReplyPass page, set your prices and bring your followers closer. Your people. Your pace.",
);
export default async function Creators() {
  const viewer = await getViewer();
  return <><CreatorLandingCount /><MarketingPage forCreators creatorAuthenticated={!!viewer} /></>;
}
