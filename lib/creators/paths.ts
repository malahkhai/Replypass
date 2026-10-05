/** Static application routes cannot become clean creator paths. */
export const reservedCreatorNames = new Set([
  "admin", "account", "api", "auth", "creator", "creators", "login", "signup",
  "vip", "notifications", "privacy", "terms", "og", "replypass", "support",
  "about", "help", "settings", "sitemap", "robots", "legal",
]);
export function creatorPath(handle: string) {
  const username = handle.replace(/^@/, "");
  if (!/^[a-z0-9_]{3,30}$/.test(username)) throw Error("Invalid creator username.");
  // Preserve access for any historic handles that now collide with app routes.
  return `/${reservedCreatorNames.has(username) ? "@" : ""}${username}`;
}
export function isCreatorProfilePath(path: string) {
  const match = /^\/(@?)([a-z0-9_]{3,30})$/.exec(path);
  return !!match && (!!match[1] || !reservedCreatorNames.has(match[2]));
}
export function creatorRedirect(handle: string, query: Record<string, string | string[] | undefined> = {}, suffix = "") {
  const path = creatorPath(handle);
  if (`/${handle}` === path) return null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  return path + suffix + (params.size ? `?${params}` : "");
}
