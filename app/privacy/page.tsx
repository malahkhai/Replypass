import { DraftPolicy } from "@/components/draft-policy";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Privacy",
  "/privacy",
  "Draft privacy outline for ReplyPass. Pending review before production launch.",
  true,
);
export default function Page() {
  return (
    <DraftPolicy
      title="Privacy"
      topics={[
        "Data collected for accounts, messages and creator requests.",
        "Optional Google Analytics loads only after you accept analytics cookies. Optional Meta advertising measurement loads only after you separately accept advertising cookies. You can reject both, accept both, or manage each choice using Cookie preferences in the footer. Choices are remembered in this browser for up to 180 days.",
        "Measurement events exclude message contents, names, creator handles, private record IDs and payment references. Google receives sanitized page groups. When advertising is accepted, Meta may receive the current page URL, approved campaign parameters, browser identifiers and a one-way encrypted version of your email address for conversion matching. Google or Meta may process device and usage information only when the corresponding optional category is enabled.",
        "Service providers, storage, retention and deletion practices to be confirmed.",
        "Privacy contacts and applicable user-request processes.",
      ]}
    />
  );
}
