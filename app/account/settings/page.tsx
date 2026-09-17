import { requireRole } from "@/lib/auth/session";
import { AccountSettings } from "@/components/account-settings";
export const metadata={title:"Account settings",robots:{index:false,follow:false}};
export default async function Page(){await requireRole(["fan","creator","admin"],"/account/settings");return <AccountSettings/>}
