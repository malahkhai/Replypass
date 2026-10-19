import Image from "next/image";
import Link from "next/link";
import { CreatorLinkStarter } from "@/components/creator-link-starter";
import { RotatingHeroTitle } from "@/components/rotating-hero-title";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from "@/lib/payments/fees";
import { exampleProfiles } from "@/lib/creators/example-profiles";
import s from "./landing-options.module.css";

const signup = "/signup?next=%2Fcreator%2Fapply";
export type FeaturedCreator = {
  name: string;
  handle: string;
  photo: string;
  photoPosition?: string;
  categories: string[];
  messagePriceCents: number | null;
  vipPriceCents: number | null;
  live: boolean;
};

function euros(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
}

function StepVisual({ step }: { step: number }) {
  if (step === 1) return <div className={`${s.stepVisual} ${s.stepProfile}`} role="img" aria-label="Example creator profile preview">
    <div className={s.stepProfilePhoto}><Image src="/images/home-creator-style.avif" alt="" fill sizes="240px" /></div>
    <div><small>getreplypass.com/yourname</small><strong>Your page, your story</strong><span>Photos · Bio · Social links</span></div>
  </div>;
  if (step === 2) return <div className={`${s.stepVisual} ${s.stepSettings}`} role="img" aria-label="Example offer and payout settings">
    <small>EXAMPLE SETUP</small><div><span>Guaranteed Reply</span><strong>€12</strong></div><div><span>VIP membership</span><strong>€9/mo</strong></div><div className={s.stepPayout}><Icon name="check" size={15} /><span>Connect Stripe for payouts</span></div>
  </div>;
  if (step === 3) return <div className={`${s.stepVisual} ${s.stepShare}`} role="img" aria-label="Example link in a social bio">
    <small>YOUR SOCIAL BIO</small><strong>getreplypass.com/yourname</strong><span>Instagram · TikTok · X</span><em>Also works with Linktree and Link.me</em>
  </div>;
  return <div className={`${s.stepVisual} ${s.stepReply}`} role="img" aria-label="Example paid reply flow">
    <small>EXAMPLE REQUEST</small><span className={s.fanBubble}>What inspired your latest song?</span><span className={s.creatorBubble}>The story started on a train home…</span><strong><Icon name="check" size={14} /> On-time reply · Payment captured</strong>
  </div>;
}

const questions = [
  ["Do I need a big following?", "No. ReplyPass is for creators with people who want to connect with them. Start with the community you already have."],
  ["Can I keep my Linktree or Link.me?", "Absolutely. Add your ReplyPass URL as a link on your existing page, or share it directly in your social bio, stories and posts."],
  ["How do Guaranteed Replies work?", "You set your price. When a fan sends a request, the amount is temporarily reserved on their card. An on-time qualifying reply completes the charge. If you decline or the deadline passes, the reservation is released; their bank may take time to remove the hold."],
  ["How do I get paid?", "Connect your payout account through Stripe and complete its verification. Track earnings and payouts in your dashboard. Bank arrival depends on Stripe’s payout schedule."],
  ["How do fans join?", "Fans visit your creator link and sign up from your page to connect with you. Your ReplyPass link is their way in."],
];

function Start({ children, className = "", href }: { children: React.ReactNode; className?: string; href: string }) {
  return <Link href={href} className={className} data-creator-cta>{children} <Icon name="arrow" size={16} /></Link>;
}

export function LandingOption({ variant, creatorAuthenticated, featuredCreator }: { variant: "studio" | "pop"; creatorAuthenticated: boolean; featuredCreator: FeaturedCreator }) {
  const pop = variant === "pop";
  const startHref = creatorAuthenticated ? "/creator/apply" : signup;
  return <main id="main" className={`${s.page} ${pop ? s.pop : s.studio}`}>
    <div className={s.opening}>
      {!pop && <Image className={s.backdrop} src="/images/home-creator-connection.avif" alt="" fill sizes="100vw" preload />}
      <nav className={s.nav} aria-label="Main navigation">
        <Link href="/" className={s.brand}>replypass<span>.</span></Link>
        <div className={s.navSections}><a href="#offers">What you can offer</a><a href="#how">How it works</a><a href="#fees">Your earnings</a></div>
        <div className={s.navActions}><Link href="/login">Log in</Link><Start href={startHref} className={s.button}>Create free page</Start></div>
      </nav>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>{pop ? "BIG PERSONALITY. CLOSER CONNECTIONS." : "GET PAID FOR THE REPLIES YOUR FOLLOWERS WANT."}</p>
          {pop ? <h1>Your people.<br/>Your world.<br/><em>Your pay-link.</em></h1> : <RotatingHeroTitle />}
          <p className={s.lead}>{pop ? "Turn ‘I wish we could talk’ into your next connection. Paid replies and VIP memberships, all in one link that’s completely you." : "Create a free page, set your price for Guaranteed Replies, and offer an optional VIP membership. Share your link anywhere your audience follows you."}</p>
          {!pop && <p className={s.compatibility}><Icon name="link" size={18} /> Already use Link.me or Linktree? Add your ReplyPass link there, or share it directly.</p>}
          <CreatorLinkStarter creatorAuthenticated={creatorAuthenticated}/>
          <div className={s.facts}><span><Icon name="check" size={14}/>Free to create</span><span><Icon name="check" size={14}/>Set your prices</span><span><Icon name="check" size={14}/>No card to start</span></div>
          <a className={s.heroSecondary} href="#how">See how it works <span aria-hidden="true">↓</span></a>
        </div>
        <div className={s.previewStage}>
          <div className={s.orbit} aria-hidden="true"/>
          <div className={s.profile}>
            <div className={s.portrait}><Image src={pop ? "/images/home-creator-connection.avif" : "/images/home-creator-style.avif"} alt="Illustrative creator profile" fill sizes="(max-width: 760px) 80vw, 370px" preload/><span className={s.previewLabel}>PROFILE PREVIEW</span><div><p>A LITTLE CLOSER TO YOU</p><h2>Your world.<br/>A little closer.</h2></div></div>
            <div className={s.profileBody}><p>getreplypass.com/yourname</p><div className={s.offerRow}><span className={s.offerIcon}><Icon name="message" size={18}/></span><div><strong>Ask me anything</strong><small>Guaranteed Reply</small></div><span className={s.rowArrow}><Icon name="arrow" size={17}/></span></div><div className={s.offerRow}><span className={s.offerIcon}><Icon name="star" size={18}/></span><div><strong>Come a little closer</strong><small>VIP membership</small></div><span className={s.rowArrow}><Icon name="arrow" size={17}/></span></div></div>
          </div>
          {pop && <><div className={s.floatCard}><span>YOUR ATTENTION HAS VALUE</span><strong>Put a price<br/>on personal.</strong><span className={s.spark}><Icon name="sparkles" size={30}/></span></div><div className={s.floatTag}>Your link. Your rules.</div></>}
        </div>
      </section>
    </div>
    {pop && <div className={s.ticker}><span>CREATORS</span><Icon name="star" size={18}/><span>ARTISTS</span><Icon name="star" size={18}/><span>ATHLETES</span><Icon name="star" size={18}/><span>EXPERTS</span><Icon name="star" size={18}/><span>YOU</span></div>}
    <section className={`${s.section} ${s.how}`} id="how">
      <p className={s.eyebrow}>FROM YOUR PAGE TO YOUR FIRST PAID REPLY</p><h2>See how ReplyPass works.</h2>
      <div className={s.steps}>{[
        ["01", "Create your free page", "Choose your link and add the photos, bio and social links that make it yours."],
        ["02", "Set your price and payouts", "Price Guaranteed Replies, add an optional VIP membership, and connect Stripe before accepting payments."],
        ["03", "Share your link", "Put ReplyPass in your social bio or existing link-in-bio page. Your followers reach your page directly."],
        ["04", "Reply and earn", "A fan sends a request. Their card is authorized first; an on-time qualifying reply completes the charge."],
      ].map(([n,title,body], index) => <article key={n}><StepVisual step={index + 1}/><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
    <section className={`${s.section} ${s.creatorExamples}`} id="examples">
      <div className={s.exampleIntro}><p className={s.eyebrow}>SEE WHAT A CREATOR PAGE CAN BE</p><h2>One link.<br/>Your kind of creator.</h2><p>Mimi’s page is live. Explore it to see a real Guaranteed Reply and VIP offer. Then browse our fictional music and DJ examples to see how the same page adapts to different creators.</p></div>
      <div className={s.creatorCards}>
        <Link className={`${s.creatorCard} ${s.realCreator}`} href="/mimi" aria-label="Visit Mimi_Kiki’s live creator page">
          <div className={s.creatorCardPhoto}><Image src={featuredCreator.photo} alt={`${featuredCreator.name} on her ReplyPass page`} fill sizes="(max-width: 760px) 88vw, 33vw" style={{ objectPosition: featuredCreator.photoPosition || "center" }} unoptimized={featuredCreator.photo.startsWith("http")}/><span>{featuredCreator.live ? "LIVE CREATOR" : "PUBLIC PROFILE"}</span></div>
          <div className={s.creatorCardBody}><small>{featuredCreator.categories.length ? featuredCreator.categories.join(" · ").toUpperCase() : "CREATOR"}</small><h3>{featuredCreator.name}</h3><p>getreplypass.com/{featuredCreator.handle.replace(/^@/, "")}</p><div className={s.cardOffers}><span>Guaranteed Reply <strong>{featuredCreator.messagePriceCents !== null ? euros(featuredCreator.messagePriceCents) : "View offer"}</strong></span><span>VIP membership <strong>{featuredCreator.vipPriceCents !== null ? `${euros(featuredCreator.vipPriceCents)}/mo` : "View offer"}</strong></span></div><span className={s.cardLink}>Visit Mimi’s page <Icon name="arrow" size={16}/></span></div>
        </Link>
        {exampleProfiles.map(({ slug, label, creator }) => <Link className={s.creatorCard} href={`/examples/${slug}`} key={slug} aria-label={`Explore fictional ${label.toLowerCase()} profile example`}>
          <div className={s.creatorCardPhoto}><Image src={creator.image} alt={`Illustrative ${label.toLowerCase()} creator portrait`} fill sizes="(max-width: 760px) 88vw, 33vw"/><span>FICTIONAL EXAMPLE</span></div>
          <div className={s.creatorCardBody}><small>{label.toUpperCase()} · PAGE EXAMPLE</small><h3>{creator.name}</h3><p>{creator.bio}</p><div className={s.cardOffers}><span>Guaranteed Reply <strong>{euros(creator.offerings.find((offer) => offer.kind === "message")!.cents)}</strong></span><span>VIP membership <strong>{euros(creator.vip!.cents)}/mo</strong></span></div><span className={s.cardLink}>Explore example page <Icon name="arrow" size={16}/></span></div>
        </Link>)}
      </div>
      <p className={s.exampleNote}>Mimi is a real creator. Luna and Nico are fictional examples; their portraits, offers and prices are illustrative, and their pages cannot accept payments.</p>
      <div className={s.useCases} aria-label="Example questions from different creator audiences">
        {[
          ["Fashion", "What inspired the look you wore last night?"],
          ["Fitness", "How did you stay consistent when you began?"],
          ["Music", "What story is behind your latest song?"],
          ["DJs", "Which track changed the energy of your set?"],
        ].map(([type, question]) => <div key={type}><strong>{type}</strong><p>“{question}”</p></div>)}
      </div>
    </section>
    <section className={`${s.section} ${s.offers}`} id="offers">
      <p className={s.eyebrow}>TWO WAYS TO EARN</p><h2>Give followers a reason to visit.</h2>
      <div className={s.offerGrid}>
        <article><div className={s.conversation}><span>EXAMPLE CONVERSATION</span><p>I love your work. What helped you get started?</p><p>Let’s talk about it. Here’s what I wish I’d known…</p><small>FAN SENDS REQUEST → CREATOR REPLIES → CHARGE COMPLETES</small></div><h3>Guaranteed Replies.</h3><p>Set a price for a personal reply. The fan’s card is temporarily authorized when they ask; you earn after a qualifying reply before the deadline. A decline or missed deadline releases the hold.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></article>
        <article><div className={s.vipArt}><Image src="/images/home-creator-style.avif" alt="" fill sizes="(max-width: 760px) 90vw, 45vw"/><div><span>THE INNER CIRCLE</span><strong>A little more you.</strong><span className={s.vipLabel}><Icon name="star" size={14}/>VIP MEMBERSHIP</span></div></div><h3>VIP memberships.</h3><p>Offer private posts and updates to subscribers at a monthly price you choose. Show fans exactly what is included; memberships renew until canceled.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></article>
      </div>
    </section>
    <section className={`${s.section} ${s.share}`}>
      <div className={s.linkArt}><span>ONE LINK. EVERYWHERE YOU ARE.</span><strong>getreplypass.com/<em>yourname</em></strong><div>{["Instagram", "TikTok", "YouTube", "Linktree", "Link.me", "Your next post"].map(label=><span key={label}>{label}</span>)}</div></div>
      <div><p className={s.eyebrow}>FITS RIGHT INTO YOUR WORLD</p><h2>Your bio just<br/>got personal.</h2><p>Add your ReplyPass link to Instagram, TikTok, X, Linktree or Link.me. Followers can visit your page directly and choose how to connect.</p><Start href={startHref} className={s.button}>Create your free page</Start></div>
    </section>
    <section className={`${s.section} ${s.fees}`} id="fees"><div><p className={s.eyebrow}>FREE TO START. CLEAR ABOUT FEES.</p><h2>Set your price.<br/>Keep your share.</h2><p>Creating your page is free. Your creator share is {CREATOR_SHARE_PERCENT}% of each completed paid reply or VIP payment; ReplyPass’s platform share is {PLATFORM_FEE_PERCENT}%.</p><p className={s.fine}>The {CREATOR_SHARE_PERCENT}% is before Stripe processing costs, refunds and other applicable adjustments. Your dashboard shows your earnings and payout status. Bank arrival follows Stripe’s schedule and requires verification.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></div><div className={s.percentage}><strong>{CREATOR_SHARE_PERCENT}<span>%</span></strong><span>CREATOR SHARE BEFORE STRIPE FEES</span></div></section>
    <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>GLAD YOU ASKED</p><h2>A few things<br/>to know.</h2></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}<Icon name="plus" size={18}/></summary><p>{a}</p></details>)}</div></section>
    <section className={s.ending}><p className={s.eyebrow}>YOUR PAGE CAN START TODAY.</p><h2>Give your followers a way<br/>to reach you.</h2><Start href={startHref} className={s.button}>Create your free page</Start><p>Free to create · Set your own prices · No card needed to start</p></section>
  </main>;
}
