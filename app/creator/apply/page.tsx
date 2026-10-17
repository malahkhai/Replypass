import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { CreatorEditor } from "@/components/creator-editor";
import { getViewer } from "@/lib/auth/session";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { creatorForUser } from "@/lib/creators/repository";
import { blankCreator } from "@/lib/creators/catalog";
export const metadata = pageMetadata("Become a creator", "/creator/apply", siteConfig.description, true);
export default async function Apply({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  const viewer = await getViewer();
  const requestedUsername = (await searchParams).username;
  const initial =
    viewer?.role === "creator" ? await creatorForUser(viewer.id) : undefined;
  const suggestedUsername = !initial && requestedUsername && /^[a-z0-9_]{3,30}$/.test(requestedUsername)
    ? { ...blankCreator, username: requestedUsername }
    : undefined;
  return (
    <CreatorEditor
      initial={initial || suggestedUsername}
      demo={!getSupabaseConfig()}
    />
  );
}
