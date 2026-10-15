import { createHash } from "node:crypto";

export function xCreatorConversionId(profileId: string) {
  return createHash("sha256")
    .update(`replypass_x_creator_registration:${profileId}`)
    .digest("hex");
}

export function xCreatorConversion(eventId: string, profileId: string, email: string, launchedAt: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw Error("X conversion requires an email identifier.");
  return {
    conversion_time: new Date(launchedAt).toISOString(),
    event_id: eventId,
    event_source_url: "https://getreplypass.com/creator/apply",
    conversion_id: xCreatorConversionId(profileId),
    identifiers: [{
      hashed_email: createHash("sha256").update(normalizedEmail).digest("hex"),
    }],
  };
}

export async function postXConversion(
  token: string,
  conversion: ReturnType<typeof xCreatorConversion>,
  send: typeof fetch = fetch,
) {
  return send("https://ads-api.x.com/12/measurement/conversions/rha5c", {
    method: "POST",
    headers: { "X-Pixel-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ conversions: [conversion] }),
    signal: AbortSignal.timeout(10_000),
  });
}
