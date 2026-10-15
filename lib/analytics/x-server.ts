import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { X_CREATOR_REGISTRATION_EVENT_ID } from "./model";
import { postXConversion, xCreatorConversion } from "./x-conversion";

export async function reportXCreatorRegistration(profileId: string, launchedAt: string) {
  const token = process.env.X_PIXEL_TOKEN;
  if (!token) return;

  const db = serviceDatabase();
  const { data: consent, error: consentError } = await db
    .from("marketing_consents")
    .select("x_allowed")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (consentError) throw Error("X conversion consent could not be checked.");
  if (!consent?.x_allowed) return;

  const { data: authUser, error: userError } = await db.auth.admin.getUserById(profileId);
  if (userError || !authUser.user?.email) throw Error("X conversion email is unavailable.");
  const conversion = xCreatorConversion(X_CREATOR_REGISTRATION_EVENT_ID, profileId, authUser.user.email, launchedAt);

  const { data: existing, error: existingError } = await db
    .from("marketing_conversion_events")
    .select("sent_at,attempts")
    .eq("event_id", conversion.conversion_id)
    .maybeSingle();
  if (existingError) throw Error("X conversion ledger is unavailable.");
  if (existing?.sent_at) return;

  const { error: ledgerError } = await db.from("marketing_conversion_events").upsert(
    {
      event_id: conversion.conversion_id,
      event_name: "X Creator registration completed",
      profile_id: profileId,
      source_id: profileId,
      attempts: (existing?.attempts || 0) + 1,
    },
    { onConflict: "event_id" },
  );
  if (ledgerError) throw Error("X conversion ledger is unavailable.");

  const response = await postXConversion(token, conversion);
  if (!response.ok) {
    const { error: failureError } = await db.from("marketing_conversion_events")
      .update({ last_error: `X HTTP ${response.status}` })
      .eq("event_id", conversion.conversion_id);
    if (failureError) throw Error("X conversion failure could not be recorded.");
    throw Error("X conversion delivery requires retry.");
  }
  const { error: sentError } = await db.from("marketing_conversion_events")
    .update({ sent_at: new Date().toISOString(), last_error: null })
    .eq("event_id", conversion.conversion_id);
  if (sentError) throw Error("X conversion receipt requires retry.");
}
