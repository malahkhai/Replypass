import { requireRole } from "@/lib/auth/session";
import { AccountSettings } from "@/components/account-settings";
import { createClient } from "@/lib/supabase/server";
export const metadata={title:"Account settings",robots:{index:false,follow:false}};
export default async function Page(){const viewer=await requireRole(["fan","creator","admin"],"/account/settings");const db=await createClient();const {data}=db?await db.from("notification_preferences").select("email_creator_onboarding").eq("profile_id",viewer.id).maybeSingle():{data:null};return <AccountSettings creator={viewer.role==="creator"} creatorReminderEmails={data?.email_creator_onboarding!==false}/>}
