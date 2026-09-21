import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Community guidelines",
  "/community-guidelines",
  "Safety and content rules for everyone using ReplyPass.",
  true,
);
export default function Page() {
  return (
    <LegalPage title="Community guidelines" summary="ReplyPass is for respectful, consensual, adult creator interactions. These rules apply to profiles, requests, messages, media, VIP posts and links."
      sections={[
        {title:"Be respectful",bullets:["Respect consent, boundaries and a creator’s right to decline.","No harassment, stalking, bullying, threats, hate, degrading sexual comments, doxxing or repeated unwanted contact.","No impersonation, deceptive identity, scams, manipulation, payment fraud or attempts to move a paid request off-platform."]},
        {title:"Sexual and exploitative content is prohibited",bullets:["No nudity, pornography, explicit sexual content, sexual services or fetish requests.","No content sexualizing, exploiting or endangering anyone under 18; no request to appear younger; no uncertain-age content.","No non-consensual intimate imagery, covert recording, sexual deepfakes, trafficking or solicitation.","No paid physical meetups, escorting, dating-for-payment or requests for personal contact details as part of a purchase."]},
        {title:"Illegal and dangerous activity",bullets:["No illegal goods or services, controlled substances, weapons trafficking or instructions that materially facilitate crime.","No credible threats, promotion of violence, self-harm encouragement, animal cruelty or dangerous challenges.","No infringement of privacy, copyright, trademark, publicity or other rights."]},
        {title:"Media and authenticity",bullets:["Upload only media you have the right to share.","Do not present manipulated or AI-generated media as authentic where that would mislead a buyer.","Do not redistribute private creator media or fan messages without permission.","Watermarks and access controls do not transfer ownership or grant redistribution rights."]},
        {title:"Reports and enforcement",paragraphs:["Use the report and block controls where available or email info@getreplypass.com with the relevant profile, content or transaction and the reason for the report. Reports should be accurate and made in good faith.","ReplyPass may decline requests, remove or restrict content, suspend transactions or accounts, preserve evidence, and notify Stripe or authorities. Decisions consider context, severity, recurrence and risk. Where appropriate, affected users receive a reason and may request review by replying to the notice or contacting support. Repeatedly submitting manifestly unfounded reports may itself lead to restrictions."]},
      ]} />
  );
}
