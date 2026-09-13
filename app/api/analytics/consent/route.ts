import { getViewer } from "@/lib/auth/session";
import { fail, readJson } from "@/lib/http";
import { serviceDatabase } from "@/lib/stripe/server";

function safeCookie(value: string | undefined, prefix: string) {
  return value && value.startsWith(prefix) && value.length <= 255 ? value : null;
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return new Response(null, { status: 204 });
  try {
    const { allowed } = await readJson(request);
    if (typeof allowed !== "boolean") return fail("Invalid consent choice.");
    const cookies = Object.fromEntries(
      (request.headers.get("cookie") || "")
        .split(";")
        .map((part) => {
          const value = part.trim();
          const separator = value.indexOf("=");
          return separator > 0
            ? [value.slice(0, separator), value.slice(separator + 1)]
            : ["", ""];
        })
        .filter(([name]) => name),
    );
    const db = serviceDatabase();
    const { error } = await db.from("marketing_consents").upsert(
      {
        profile_id: viewer.id,
        allowed,
        fbp: allowed ? safeCookie(cookies._fbp, "fb.1.") : null,
        fbc: allowed ? safeCookie(cookies._fbc, "fb.1.") : null,
        client_user_agent: allowed
          ? request.headers.get("user-agent")?.slice(0, 500) || null
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch {
    return fail("Unable to save analytics preferences.", 409);
  }
}
