import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { PLATFORM_FEE_PERCENT, CREATOR_SHARE_PERCENT, splitPayment } from "@/lib/payments/fees";
import { Price } from "./ui";
import { HomepageSpotlight } from "./homepage-spotlight";
import { CreatorLinkStarter } from "./creator-link-starter";

export function MarketingPage({ creatorAuthenticated = false }: { creatorAuthenticated?: boolean }) {
  const split = splitPayment(400);
  const creatorHref = creatorAuthenticated ? "/creator/apply" : "/signup?next=%2Fcreator%2Fapply";
  return (
    <main id="main" className="marketing">
      <section className="marketing-hero">
        <div className="marketing-copy">
          <p className="eyebrow">YOUR FOLLOWERS. YOUR TERMS.</p>
          <h1><em>Access is premium.</em>Turn it into income<span>.</span></h1>
          <p className="marketing-lead">Your pay-link in bio for Guaranteed Replies and VIP memberships. Set your price, share your link, and get paid for conversations with your followers.</p>
          <CreatorLinkStarter creatorAuthenticated={creatorAuthenticated} />
          <div className="marketing-actions marketing-actions-secondary"><Link href="#how-it-works">See how it works ↓</Link></div>
          <p className="marketing-note">Your page is free to create. Connect an eligible Stripe account before offering paid replies.</p>
        </div>
        <HomepageSpotlight />
      </section>

      <section className="marketing-strip" aria-label="Where your ReplyPass link works">
        <p><strong>One personal link.</strong><br />A closer way to connect.</p>
        <div>Already use Linktree or Link.me? Add your ReplyPass link there, or put it directly in your social bio.</div>
      </section>

      <section id="how-it-works" className="marketing-section">
        <div className="marketing-section-heading">
          <p className="eyebrow">FROM PROFILE TO FIRST REPLY</p>
          <h2>Four steps to open the conversation.</h2>
          <p>Build the page, put your link where your followers already are, and decide which conversations are worth your time.</p>
        </div>
        <div className="marketing-steps marketing-steps-four">
          {[
            ["01", "Create your link", "Choose your username and publish a page at getreplypass.com/yourname."],
            ["02", "Make it yours", "Add your photos, bio and social links. Choose your offers, prices and availability."],
            ["03", "Share it anywhere", "Add your ReplyPass link to Instagram, TikTok, Linktree or Link.me. Invite followers to ask you something personal."],
            ["04", "Reply and earn", "Connect Stripe for paid offers. Review requests, send a qualifying reply and follow your earnings in one dashboard."],
          ].map(([n, title, body]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="marketing-promise">
        <div><p className="eyebrow">A CLEAR PROMISE FOR YOUR FOLLOWERS</p><h2>No reply.<br />No charge<span>.</span></h2></div>
        <div>
          <p>When someone requests a Guaranteed Reply, the price is reserved on their card. A qualifying reply within the deadline completes the charge. If you decline or the deadline passes, the reservation is canceled.</p>
          <p>That promise gives followers confidence to reach out and lets you set a fair price for your attention.</p>
          <span className="marketing-status">Secure payments through Stripe</span>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section-heading"><p className="eyebrow">MAKE THE CONNECTION YOURS</p><h2>Offer more than a link.</h2><p>ReplyPass gives followers a reason to visit your page, and gives you control over how they reach you.</p></div>
        <div className="marketing-offers">
          {[
            ["↗", "Guaranteed Replies", "Let followers ask a question at a price you set. You choose which requests to accept.", "PAY PER COMPLETED REPLY"],
            ["♡", "VIP memberships", "Share private posts, exclusive updates and access to your VIP inbox.", "MONTHLY MEMBERSHIP"],
          ].map(([icon, title, body, status]) => <article key={title}><span className="marketing-offer-icon" aria-hidden="true">{icon}</span><small>{status}</small><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="marketing-creator marketing-fan-view">
        <div>
          <p className="eyebrow">WHAT FOLLOWERS SEE</p><h2>Your page.<br />Your people.</h2>
          <p>Someone who opens your link lands on your profile, sees the ways to connect with you, and signs up in your context when they choose an interaction. There is no public fan signup or creator directory to pull them away.</p>
          <Link className="button button-primary" href={creatorHref}>Build my creator page ↗</Link>
        </div>
        <ol>
          <li><strong>They open your link</strong><p>From your bio, story, post or link-in-bio page.</p></li>
          <li><strong>They choose how to connect</strong><p>They can ask for a Guaranteed Reply or join your VIP community, if you offer it.</p></li>
          <li><strong>You stay in control</strong><p>Requests and conversations live in your dashboard, with your availability and prices visible up front.</p></li>
        </ol>
      </section>

      <section className="marketing-fees">
        <div><p className="eyebrow">CLEAR FROM THE START</p><h2>You set the price.<br />You keep {CREATOR_SHARE_PERCENT}%.</h2><p>ReplyPass’s platform share is {PLATFORM_FEE_PERCENT}%. The split is shown before you reply. Stripe processing costs are separate; transferred earnings are distinct from bank payouts.</p></div>
        <div className="marketing-receipt"><p>AN EXAMPLE GUARANTEED REPLY</p><dl>
          <div><dt>Fan price</dt><dd><Price cents={split.fanCents} decimals /></dd></div>
          <div><dt>ReplyPass · {PLATFORM_FEE_PERCENT}%</dt><dd><Price cents={split.platformCents} decimals /></dd></div>
          <div><dt>Creator share · {CREATOR_SHARE_PERCENT}%</dt><dd><Price cents={split.creatorCents} decimals /></dd></div>
        </dl><small>Example based on a €4 completed request, before Stripe fees.</small></div>
      </section>

      <section className="marketing-faq">
        <div><p className="eyebrow">BEFORE YOU START</p><h2>Good questions.<br />Straight answers.</h2></div>
        <div>{[
          ["Do I need to replace my Linktree or Link.me?", "No. Add your ReplyPass page as a link on either one. You can also share it directly in a social bio, story or post."],
          ["What do I need to publish my page?", "Choose a username, add your profile details and publish. You can create your page before connecting payouts. To enable paid replies, complete Stripe payout onboarding."],
          ["Can fans sign up from the homepage?", "No. Fans join from a creator’s page, so their first experience stays focused on that person. Their account can later keep conversations with multiple creators together."],
          ["When is a Guaranteed Reply charged?", "The amount is reserved first. A qualifying creator reply before the deadline completes the charge. A decline or an unanswered deadline cancels the reservation; banks may take time to remove the hold."],
          ["What kind of community is ReplyPass?", "ReplyPass is designed for respectful, brand-safe interactions across sport, music, fashion, business and everyday creativity. It isn’t an adult-content platform. Read our Community Guidelines for the rules."],
        ].map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
      </section>

      <section className="marketing-end"><p className="eyebrow">YOUR LINK. YOUR CONVERSATIONS.</p><h2>Give your followers a closer way to reach you.</h2><Link className="button button-primary" href={creatorHref}>Create my page ↗</Link><p>Already part of {siteConfig.name}? <Link href="/login">Log in</Link></p></section>
    </main>
  );
}
