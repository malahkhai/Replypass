import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { sendTransactionalEmail } from "@/lib/email/service";
import { creatorUrl } from "@/lib/site";

export type SetupStage = "welcome" | "reminder";

export async function sendCreatorSetupEmail(profileId: string, stage: SetupStage) {
  const db = serviceDatabase();
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("id,display_name,role,signup_intent,account_status,created_at")
    .eq("id", profileId).maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.role !== "creator" || profile.signup_intent !== "creator" || profile.account_status !== "active") return "ineligible" as const;
  const [{ data: creator, error: creatorError }, { data: preferences, error: preferencesError }, { data: auth, error: authError }] = await Promise.all([
    db.from("creator_profiles").select("id,onboarding_complete").eq("profile_id", profileId).maybeSingle(),
    db.from("notification_preferences").select("email_creator_onboarding").eq("profile_id", profileId).maybeSingle(),
    db.auth.admin.getUserById(profileId),
  ]);
  if (creatorError || preferencesError || authError) throw creatorError || preferencesError || authError;
  if (creator?.onboarding_complete || preferences?.email_creator_onboarding === false || !auth.user?.email_confirmed_at || !auth.user.email) return "ineligible" as const;
  if (stage === "reminder" && Date.now() - Date.parse(profile.created_at) < 48 * 3600000) return "too_early" as const;
  const result = await sendTransactionalEmail({
    recipientId: profileId,
    to: auth.user.email,
    template: stage === "welcome" ? "creator_setup" : "creator_setup_reminder",
    eventKey: `creator-onboarding:${stage}:${profileId}`,
    link: "https://getreplypass.com/creator/apply",
    name: profile.display_name,
  });
  return result.status;
}

export async function sendCreatorPageLiveEmail(profileId: string) {
  const db = serviceDatabase();
  const [{ data: profile, error: profileError }, { data: creator, error: creatorError }, { data: auth, error: authError }] = await Promise.all([
    db.from("profiles").select("display_name,role,account_status").eq("id", profileId).maybeSingle(),
    db.from("creator_profiles").select("handle,status,onboarding_complete").eq("profile_id", profileId).maybeSingle(),
    db.auth.admin.getUserById(profileId),
  ]);
  if (profileError || creatorError || authError) throw profileError || creatorError || authError;
  if (!profile || !creator || profile.role !== "creator" || profile.account_status !== "active" || creator.status !== "approved" || !creator.onboarding_complete || !auth.user?.email) return "ineligible" as const;
  const result = await sendTransactionalEmail({
    recipientId: profileId, to: auth.user.email, template: "creator_page_live",
    eventKey: `creator-page-live:${profileId}`, link: creatorUrl(creator.handle), name: profile.display_name,
  });
  return result.status;
}

export async function deliverCreatorSetupReminders() {
  const db = serviceDatabase();
  const { data, error } = await db.rpc("due_creator_setup_reminders", { batch_size: 5 });
  if (error) throw error;
  let sent = 0;
  for (const profile of data || []) {
    const outcome = await sendCreatorSetupEmail(profile.profile_id, "reminder");
    if (outcome === "sent") sent++;
  }
  return sent;
}
