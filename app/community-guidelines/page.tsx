import { DraftPolicy } from "@/components/draft-policy";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Community guidelines",
  "/community-guidelines",
  "Draft community guidelines outline for ReplyPass. Pending review before production launch.",
  true,
);
export default function Page() {
  return (
    <DraftPolicy
      title="Community guidelines"
      topics={[
        "Respectful, brand-safe interactions and creator boundaries.",
        "Requests involving nudity, pornography, explicit sexual content, sexual services, illegal content, harassment, threats, minors or paid physical meetups are prohibited.",
        "Creators may decline requests they are uncomfortable with, report the request, and block the sender.",
        "Handling harassment, impersonation and unauthorized media.",
        "Reporting, moderation and review processes to be finalized.",
      ]}
    />
  );
}
