import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { demoViewer } from "./demo";
import type { UserRole } from "@/types/domain";
import type { Viewer } from "@/types/creator";
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  if (!supabase) return demoViewer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,display_name,account_status")
    .eq("id", user.id)
    .single();
  if (profileError || !data)
    throw new Error(
      "Your profile could not be loaded. Check the database migrations and try again.",
    );
  if (data.account_status !== "active") return null;
  return {
    id: user.id,
    role: data.role as UserRole,
    displayName: data.display_name,
    demo: false,
    accountStatus: data.account_status,
  };
}

export async function requireAdmin(next = "/admin") {
  return requireRole(["admin"], next);
}
export async function requireRole(
  roles: readonly UserRole[],
  next = "/account",
) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!roles.includes(viewer.role)) redirect("/account");
  return viewer;
}
