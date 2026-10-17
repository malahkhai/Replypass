import { creatorPath } from "./creators/paths.ts";
/** Public brand configuration only. Never put secrets in this module. */
export function normalizeAppUrl(value: string) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be an HTTP(S) origin without a path or credentials.",
    );
  }
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error("Public application URLs must use HTTPS.");
  return url.origin;
}
const domain = "getreplypass.com";
export const siteConfig = {
  name: "ReplyPass",
  logo: "replypass",
  domain,
  url: normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`),
  title: "ReplyPass — Your link for real conversations",
  description:
    "Create your ReplyPass page, share it with your followers, and earn from Guaranteed Replies and VIP memberships on your terms.",
  tagline: "A closer way to connect with your followers.",
  creatorProposition: "Get paid to reply to your followers.",
  fanPromise: "No reply = no charge.",
} as const;
export function creatorUrl(handle: string) {
  const username = handle.replace(/^@/, "");
  if (!/^[a-z0-9_]{3,30}$/.test(username))
    throw new Error("Invalid creator username.");
  return `${siteConfig.url}${creatorPath(username)}`;
}
/** Keep a verified Preview checkout/auth flow on its own deployment. */
export function authOrigin(observedOrigin: string, configuredOrigin = siteConfig.url) {
  const url = new URL(observedOrigin);
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ? normalizeAppUrl(url.origin)
    : url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        /^replypass-[a-z0-9-]+-akinola-akintundes-projects\.vercel\.app$/.test(
          new URL(configuredOrigin).hostname,
        ) &&
        /^replypass-[a-z0-9-]+-akinola-akintundes-projects\.vercel\.app$/.test(
          url.hostname,
        )
      ? normalizeAppUrl(url.origin)
      : configuredOrigin;
}
