export type Campaign = { source: string; medium: string; campaign: string };

const storageKey = "replypass:first-party-campaign:v1";
const maxAgeMs = 24 * 60 * 60 * 1000;

function safeTag(value: string | null) {
  const tag = value?.trim().toLowerCase();
  return tag && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(tag) ? tag : null;
}

export function campaignFromSearch(search: string): Campaign | null {
  const params = new URLSearchParams(search);
  const source = safeTag(params.get("utm_source"));
  const medium = safeTag(params.get("utm_medium"));
  if (!source || !medium) return null;
  return {
    source,
    medium,
    campaign: safeTag(params.get("utm_campaign")) || "unspecified",
  };
}

export function rememberCampaign(search: string) {
  const campaign = campaignFromSearch(search);
  if (!campaign) return;
  try { sessionStorage.setItem(storageKey, JSON.stringify({ ...campaign, at: Date.now() })); }
  catch { /* Attribution storage is best effort; signup still works. */ }
}

export function signupCampaign(): Campaign | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as Campaign & { at?: number };
    if (!value.at || Date.now() - value.at > maxAgeMs) return null;
    return campaignFromSearch(new URLSearchParams({
      utm_source: value.source,
      utm_medium: value.medium,
      utm_campaign: value.campaign,
    }).toString());
  } catch { return null; }
}
