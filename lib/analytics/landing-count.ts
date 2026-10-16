import "server-only";
import type { Campaign } from "./campaign";

const prefix = "replypass:landing:creators:";
const retentionSeconds = 90 * 86400;

function storeConfig() {
  const custom = process.env.RATE_LIMIT_REST_URL || process.env.RATE_LIMIT_REST_TOKEN;
  const url = custom ? process.env.RATE_LIMIT_REST_URL : process.env.KV_REST_API_URL;
  const token = custom ? process.env.RATE_LIMIT_REST_TOKEN : process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw Error("Landing-count store unavailable.");
  return { url: url.replace(/\/$/, ""), token };
}

async function pipeline(commands: (string | number)[][]) {
  const { url, token } = storeConfig();
  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw Error("Landing-count store unavailable.");
  const results = (await response.json()) as { result?: number | string | string[] | Record<string,string> | null; error?: string }[];
  if (!Array.isArray(results) || results.some(item => item.error))
    throw Error("Landing-count store unavailable.");
  return results;
}

export async function recordCreatorLandingLoad(campaign: Campaign | null) {
  const key = `${prefix}${new Date().toISOString().slice(0, 10)}`;
  const campaignKey = `${key}:campaigns`;
  const tag = campaign ? `${campaign.source}:${campaign.campaign}` : "untagged:unspecified";
  await pipeline([
    ["INCR", key], ["EXPIRE", key, retentionSeconds, "NX"],
    ["HINCRBY", campaignKey, tag, 1], ["EXPIRE", campaignKey, retentionSeconds, "NX"],
  ]);
}

export async function creatorLandingLoadsLast7Days() {
  const keys = Array.from({ length: 7 }, (_, day) =>
    `${prefix}${new Date(Date.now() - day * 86400000).toISOString().slice(0, 10)}`);
  const results = await pipeline(keys.map(key => ["GET", key]));
  return results.reduce((total, item) => total + (Number(item.result) || 0), 0);
}

export async function creatorLandingCampaignsLast7Days() {
  const keys = Array.from({ length: 7 }, (_, day) =>
    `${prefix}${new Date(Date.now() - day * 86400000).toISOString().slice(0, 10)}:campaigns`);
  const results = await pipeline(keys.map(key => ["HGETALL", key]));
  const totals = new Map<string, number>();
  for (const item of results) {
    const result = item.result;
    const entries = Array.isArray(result)
      ? Array.from({ length: Math.floor(result.length / 2) }, (_, i) => [result[i * 2], result[i * 2 + 1]])
      : result && typeof result === "object" ? Object.entries(result) : [];
    for (const [tag, rawCount] of entries) {
      const count = Number(rawCount);
      if (typeof tag === "string" && /^[a-z0-9_-]{1,64}:[a-z0-9_-]{1,64}$/.test(tag) && Number.isFinite(count))
        totals.set(tag, (totals.get(tag) || 0) + count);
    }
  }
  return [...totals].map(([tag, loads]) => {
    const [source, campaign] = tag.split(":");
    return { source, campaign, loads };
  }).sort((a, b) => b.loads - a.loads).slice(0, 30);
}
