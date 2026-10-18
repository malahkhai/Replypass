import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { AuthForm } from "@/components/auth-form";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { findCreator } from "@/lib/creators/repository";
import {
  safeNext,
  isCreatorDestination,
  isCreatorSetupDestination,
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
  // A generic site signup always starts creator setup. Fan signup is only
  // rendered with a valid, published creator destination.
  const creatorApplication = !q.next || isCreatorSetupDestination(q.next);

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
          <Link className="button button-primary" href="/">
            Become a creator <Icon name="arrow" size={16} />
          </Link>
          <p className="auth-switch">
            <Link href="/">Back to ReplyPass</Link>
          </p>
        </section>
      </main>
    );
  }

  const destination = creatorApplication
    ? safeNext(q.next || "/creator/apply")
    : safeNext(q.next);

  return (
    <main id="main" className="auth-page auth-page-signup auth-page-immersive">
      <Image className="auth-immersive-image" src="/images/home-creator-connection.avif" alt="" fill sizes="100vw" priority />
      <div className="auth-immersive-shade" aria-hidden="true" />
      <nav className="auth-immersive-nav" aria-label="Signup navigation">
        <Link href="/" className="auth-immersive-brand">replypass<span>.</span></Link>
        <Link href={`/login?next=${encodeURIComponent(destination)}`} className="auth-immersive-login">Log in <Icon name="arrow" size={16} /></Link>
      </nav>
      <div className="auth-immersive-layout">
        <section className="auth-intro">
          <span className="eyebrow">{creatorApplication ? "A LINK FOR CLOSER CONNECTIONS" : "YOU’RE ALMOST THERE"}</span>
          <h1>{creatorApplication ? <>Your people.<br/>Your page.<br/><em>Your terms.</em></> : `Get closer to ${creator!.name.split(" ")[0]}.`}</h1>
          <p className="auth-description">
            {creatorApplication
              ? "Create your ReplyPass page, offer Guaranteed Replies and VIP memberships, and share your pay-link wherever your fans find you."
              : `Create your free fan profile to message ${creator!.name.split(" ")[0]}, follow your request and keep the conversation in one place.`}
          </p>
          {creatorApplication ? <p className="auth-immersive-note">Already have a Link.me or Linktree? Your ReplyPass link fits right in.</p> : (
            <div className="auth-benefits" aria-label="Fan account benefits">
              <div><span>01</span><p><strong>Start with a creator</strong>Open their ReplyPass link from a bio, story or post.</p></div>
              <div><span>02</span><p><strong>No reply, no charge</strong>Follow every paid request from reservation to delivery.</p></div>
              <div><span>03</span><p><strong>One private inbox</strong>Return to your conversations from any device.</p></div>
            </div>
          )}
        </section>
        <section className="auth-card" aria-label={creatorApplication ? "Create your creator account" : "Create your fan profile"}>
          <span className="auth-card-kicker">{creatorApplication ? "CREATOR ACCOUNT" : "FREE FAN PROFILE"}</span>
          <h2>{creatorApplication ? "Make your page yours." : "Create your fan profile."}</h2>
          <p>{creatorApplication ? "Start free. Confirm your email, then choose your profile link." : "No public profile setup. Just the details you need to connect."}</p>
          <AuthForm
            mode="signup"
            configured={!!getSupabaseConfig()}
            next={destination}
            fanCreatorId={creatorApplication ? undefined : creator!.id}
          />
        </section>
      </div>
    </main>
  );
}
