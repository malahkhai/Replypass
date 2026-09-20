import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { AuthForm } from "@/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { findCreator } from "@/lib/creators/repository";
import {
  safeNext,
  isCreatorDestination,
} from "@/lib/auth/paths";
export const metadata = pageMetadata(
  "Join",
  "/signup",
  siteConfig.description,
  true,
);
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const q = await searchParams;
  const creator = isCreatorDestination(q.next)
    ? await findCreator(q.next.split("?")[0].slice(1))
    : null;
  const creatorMissing = isCreatorDestination(q.next) && !creator;
  return (
    <main id="main" className="auth-page auth-page-signup">
      <section className="auth-intro">
        <span className="eyebrow">
          {creator ? "YOU’RE ALMOST THERE" : "YOUR PEOPLE ARE HERE"}
        </span>
        <h1>
          {creator
            ? `Get closer to ${creator.name.split(" ")[0]}.`
            : "Keep every conversation close."}
        </h1>
        <p className="auth-description">
          {creator
            ? `Create your free fan profile to message ${creator.name.split(" ")[0]}, follow your request and keep the conversation in one place.`
            : "Create your free fan profile for the creators you follow. Your messages, requests and memberships stay together in one private space."}
        </p>
        <div className="auth-benefits" aria-label="Fan account benefits">
          <div><span>01</span><p><strong>Start with a creator</strong>Open their ReplyPass link from a bio, story or post.</p></div>
          <div><span>02</span><p><strong>No reply, no charge</strong>Follow every paid request from reservation to delivery.</p></div>
          <div><span>03</span><p><strong>One private inbox</strong>Return to your conversations from any device.</p></div>
        </div>
      </section>
      <section className="auth-card" aria-label="Create your fan profile">
        <span className="auth-card-kicker">FREE FAN PROFILE</span>
        <h2>Create your account.</h2>
        <p>No public profile setup. Just the details you need to connect.</p>
        {creatorMissing && (
          <p className="form-error">That creator link is no longer available. You can still create your fan profile.</p>
        )}
        <AuthForm
          mode="signup"
          configured={!!getSupabaseConfig()}
          next={creatorMissing ? "/account" : safeNext(q.next)}
        />
      </section>
    </main>
  );
}
