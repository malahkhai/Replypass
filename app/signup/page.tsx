import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
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
  const creatorApplication = q.next === "/creator/apply";

  if (!creatorApplication && !creator) {
    return (
      <main id="main" className="auth-page auth-page-signup">
        <section className="auth-card auth-signup-gate">
          <span className="auth-card-kicker">A PERSONAL CONNECTION</span>
          <h1>A connection starts with a creator.</h1>
          <p>
            {creatorMissing
              ? "This creator link is no longer available. Ask them for their current ReplyPass link to continue."
              : "Fans create an account from a creator’s ReplyPass page, keeping that creator and your chosen interaction with you through signup."}
          </p>
          <p>
            Once you join, one account keeps your conversations and memberships
            together across the creators you follow.
          </p>
          <Link className="button button-primary" href="/creators">
            Become a creator <span aria-hidden="true">↗</span>
          </Link>
          <p className="auth-switch">
            <Link href="/">Back to ReplyPass</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="auth-page auth-page-signup">
      <section className="auth-intro">
        <span className="eyebrow">
          {creatorApplication
            ? "CREATOR SETUP"
            : "YOU’RE ALMOST THERE"}
        </span>
        <h1>
          {creatorApplication
            ? "Build your creator page."
            : `Get closer to ${creator!.name.split(" ")[0]}.`}
        </h1>
        <p className="auth-description">
          {creatorApplication
            ? "Create the account you’ll use to set up your ReplyPass creator page."
            : `Create your free fan profile to message ${creator!.name.split(" ")[0]}, follow your request and keep the conversation in one place.`}
        </p>
        {!creatorApplication && (
          <div className="auth-benefits" aria-label="Fan account benefits">
            <div><span>01</span><p><strong>Start with a creator</strong>Open their ReplyPass link from a bio, story or post.</p></div>
            <div><span>02</span><p><strong>No reply, no charge</strong>Follow every paid request from reservation to delivery.</p></div>
            <div><span>03</span><p><strong>One private inbox</strong>Return to your conversations from any device.</p></div>
          </div>
        )}
      </section>
      <section className="auth-card" aria-label={creatorApplication ? "Create your creator account" : "Create your fan profile"}>
        <span className="auth-card-kicker">{creatorApplication ? "CREATOR ACCOUNT" : "FREE FAN PROFILE"}</span>
        <h2>{creatorApplication ? "Create your account." : "Create your fan profile."}</h2>
        <p>{creatorApplication ? "Set up your creator page after you confirm your email." : "No public profile setup. Just the details you need to connect."}</p>
        <AuthForm
          mode="signup"
          configured={!!getSupabaseConfig()}
          next={safeNext(q.next)}
        />
      </section>
    </main>
  );
}
