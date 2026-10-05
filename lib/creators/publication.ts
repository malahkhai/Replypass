import { creatorPath } from "./paths.ts";

export function creatorPublication(creator: { username: string; publicationStatus?: string; onboardingComplete?: boolean }, demo = false) {
  const published = demo || (creator.publicationStatus === "approved" && creator.onboardingComplete === true);
  const status = creator.publicationStatus;
  const title = published ? "Your page is live" : status === "suspended" ? "Your page is unavailable" : status === "rejected" ? "Your application needs attention" : status === "under_review" ? "Your account is under review" : creator.onboardingComplete ? "Verify your email to publish" : "Complete your creator profile";
  const description = published ? "Your creator link is ready to share." : status === "suspended" ? "Your public page is currently suspended. Contact support for help." : status === "rejected" ? "Your application has not been approved. Contact support to discuss the next steps." : status === "under_review" ? "Your account is being reviewed. You can preview your profile while it is unavailable to the public." : creator.onboardingComplete ? "Verify your email, then save your profile to make your creator link public." : "Finish your profile and publish it before sharing your creator link.";
  return { published, title, description, href: published ? creatorPath(creator.username) : "/creator/preview", label: published ? "View your page" : "Preview your page" };
}
