import { isCreatorProfilePath } from "../creators/paths.ts";
export const GA_ID = "G-C6DL1WLHDM";
export const CONSENT_KEY = "replypass:analytics-consent:v1";
export const MARKETING_CONSENT_KEY = "replypass:marketing-consent:v1";
export const X_CONSENT_KEY = "replypass:x-consent:v1";
export const X_CREATOR_REGISTRATION_EVENT_ID = "tw-rha5c-rhab8";
export const META_PIXEL_ID_PATTERN = /^\d{5,20}$/;
export function analyticsHostAllowed(hostname: string) {
  return hostname === "getreplypass.com" || hostname === "www.getreplypass.com";
}
export function pageGroup(path: string) {
  if (isCreatorProfilePath(path)) return "creator_profile";
  if (/^\/creator\/inbox\/[^/]+$/.test(path)) return "creator_conversation";
  const pages: Record<string, string> = {
    "/": "home", "/creators": "creator_landing", "/login": "login", "/signup": "signup",
    "/creator/apply": "creator_onboarding", "/account": "fan_account", "/account/requests": "fan_requests",
    "/terms": "terms", "/privacy": "privacy", "/community-guidelines": "community_guidelines", "/creator-terms": "creator_terms",
  };
  if (pages[path]) return pages[path];
  if (/^\/creator\/(dashboard|inbox|requests|subscribers|earnings|analytics|profile|settings|payouts)$/.test(path)) return path.slice(1).replaceAll("/", "_");
  return "other";
}

// Keep private paths and arbitrary query strings out of GA while preserving
// deliberately tagged campaign attribution for consented visits.
export function analyticsPageLocation(path: string, search: string) {
  const url = new URL(`https://getreplypass.com/${pageGroup(path)}`);
  const incoming = new URLSearchParams(search);
  const source = safeCampaignValue(incoming.get("utm_source"));
  const medium = safeCampaignValue(incoming.get("utm_medium"));
  if (source && medium) {
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    const campaign = safeCampaignValue(incoming.get("utm_campaign"));
    if (campaign) url.searchParams.set("utm_campaign", campaign);
  }
  return url.toString();
}

function safeCampaignValue(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : null;
}
export function readChoice(raw: string | null, now = Date.now()): boolean | null {
  try {
    const value = JSON.parse(raw || "null");
    return typeof value?.accepted === "boolean" && typeof value.at === "number" && value.at <= now && now - value.at < 180 * 86400000 ? value.accepted : null;
  } catch { return null; }
}

export function validMetaPixelId(value: string | undefined) {
  return META_PIXEL_ID_PATTERN.test(value ?? "");
}
