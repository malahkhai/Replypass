import { authOrigin } from "@/lib/site";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/paths";
import { after } from "next/server";
import { sendCreatorSetupEmail } from "@/lib/notifications/creator-onboarding";
import { captureException } from "@/lib/observability/log";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) after(async () => {
        try { await sendCreatorSetupEmail(data.user!.id, "welcome"); }
        catch (cause) { captureException(cause, { event: "creator_setup_email", status: "failed" }); }
      });
      return NextResponse.redirect(
        new URL(
          `/auth/continue?next=${encodeURIComponent(safeNext(url.searchParams.get("next")))}`,
          authOrigin(url.origin),
        ),
      );
    }
  }
  return NextResponse.redirect(
    new URL(
      `/login?error=confirmation&next=${encodeURIComponent(safeNext(url.searchParams.get("next")))}`,
      url.origin,
    ),
  );
}
