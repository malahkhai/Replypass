import "server-only";

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
  const results = (await response.json()) as { result?: number | string | null; error?: string }[];
  if (!Array.isArray(results) || results.some(item => item.error))
    throw Error("Landing-count store unavailable.");
  return results;
}

export async function recordCreatorLandingLoad() {
  const key = `${prefix}${new Date().toISOString().slice(0, 10)}`;
  await pipeline([["INCR", key], ["EXPIRE", key, retentionSeconds, "NX"]]);
}

export async function creatorLandingLoadsLast7Days() {
  const keys = Array.from({ length: 7 }, (_, day) =>
    `${prefix}${new Date(Date.now() - day * 86400000).toISOString().slice(0, 10)}`);
  const results = await pipeline(keys.map(key => ["GET", key]));
  return results.reduce((total, item) => total + (Number(item.result) || 0), 0);
}
