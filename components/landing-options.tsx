import Image from "next/image";
import Link from "next/link";
import { CreatorLinkStarter } from "@/components/creator-link-starter";
import { RotatingHeroTitle } from "@/components/rotating-hero-title";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from "@/lib/payments/fees";
import s from "./landing-options.module.css";

const signup = "/signup?next=%2Fcreator%2Fapply";
const questions = [
  ["Do I need a big following?", "No. ReplyPass is for creators with people who want to connect with them. Start with the community you already have."],
  ["Can I keep my Linktree or Link.me?", "Absolutely. Add your ReplyPass URL as a link on your existing page, or share it directly in your social bio, stories and posts."],
  ["How do Guaranteed Replies work?", "You set your price and response window. A fan sends a paid request, and payment is captured when you reply on time. No reply, no charge."],
  ["How do I get paid?", "Connect your payout account through Stripe and complete its verification. Track earnings and payouts in your dashboard. Bank arrival depends on Stripe’s payout schedule."],
  ["How do fans join?", "Fans visit your creator link and sign up from your page to connect with you. Your ReplyPass link is their way in."],
];

function Start({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Link href={signup} className={className} data-creator-cta>{children} <Icon name="arrow" size={16} /></Link>;
}

export function LandingOption({ variant, creatorAuthenticated }: { variant: "studio" | "pop"; creatorAuthenticated: boolean }) {
  const pop = variant === "pop";
  return <main id="main" className={`${s.page} ${pop ? s.pop : s.studio}`}>
    <div className={s.opening}>
      {!pop && <Image className={s.backdrop} src="/images/home-creator-connection.avif" alt="" fill sizes="100vw" preload />}
      <nav className={s.nav} aria-label="Main navigation">
        <Link href="/" className={s.brand}>replypass<span>.</span></Link>
        <div className={s.navSections}><a href="#offers">What you can offer</a><a href="#how">How it works</a><a href="#fees">Your earnings</a></div>
        <div className={s.navActions}><Link href="/login">Log in</Link><Start className={s.button}>Start for free</Start></div>
      </nav>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>{pop ? "BIG PERSONALITY. CLOSER CONNECTIONS." : "ACCESS IS PREMIUM. SO ARE YOU."}</p>
          {pop ? <h1>Your people.<br/>Your world.<br/><em>Your pay-link.</em></h1> : <RotatingHeroTitle />}
          <p className={s.lead}>{pop ? "Turn ‘I wish we could talk’ into your next connection. Paid replies and VIP memberships, all in one link that’s completely you." : "Your attention has value. Turn it into income with Guaranteed Replies and VIP memberships in one pay-link in bio."}</p>
          {!pop && <p className={s.compatibility}><Icon name="link" size={18} /> Already use Link.me or Linktree? Add your ReplyPass link there, or share it directly.</p>}
          <CreatorLinkStarter creatorAuthenticated={creatorAuthenticated}/>
          <div className={s.facts}><span><Icon name="check" size={14}/>Free to create</span><span><Icon name="check" size={14}/>Your prices</span><span><Icon name="check" size={14}/>Your boundaries</span></div>
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
      <p className={s.eyebrow}>LESS SETUP. MORE CONNECTION.</p><h2>Your next chapter.<br/>Three simple steps.</h2>
      <div className={s.steps}>{[
        ["01", "Make it yours.", "Create your profile link. Add your photos, bio and socials, and let your personality do the talking."],
        ["02", "Set your offers.", "Choose your reply price and VIP offering. Connect Stripe to get your paid offers ready."],
        ["03", "Share. Connect. Earn.", "Put your link in your bio or on Linktree or Link.me. Invite your followers to start a conversation."],
      ].map(([n,title,text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className={`${s.section} ${s.offers}`} id="offers">
      <p className={s.eyebrow}>GOOD CONVERSATIONS START HERE</p><h2>More than a follow.<br/>A real connection.</h2>
      <div className={s.offerGrid}>
        <article><div className={s.conversation}><span>EXAMPLE CONVERSATION</span><p>I love your work. What helped you get started?</p><p>Let’s talk about it. Here’s what I wish I’d known…</p><small>PERSONAL ATTENTION. ON YOUR TERMS.</small></div><h3>Your reply.<br/>Worth asking for.</h3><p>Give your fans a way to reach you. Set your price and reply window, then make every answer personal.</p><Start className={s.textLink}>Offer Guaranteed Replies</Start></article>
        <article><div className={s.vipArt}><Image src="/images/home-creator-style.avif" alt="" fill sizes="(max-width: 760px) 90vw, 45vw"/><div><span>THE INNER CIRCLE</span><strong>A little more you.</strong><span className={s.vipLabel}><Icon name="star" size={14}/>VIP MEMBERSHIP</span></div></div><h3>Your inner circle.<br/>Their favorite place.</h3><p>Create a VIP membership for the people who want to stay closer. Define your offering and set your monthly price.</p><Start className={s.textLink}>Build your VIP circle</Start></article>
      </div>
    </section>
    <section className={`${s.section} ${s.share}`}>
      <div className={s.linkArt}><span>ONE LINK. EVERYWHERE YOU ARE.</span><strong>getreplypass.com/<em>yourname</em></strong><div>{["Instagram", "TikTok", "YouTube", "Linktree", "Link.me", "Your next post"].map(label=><span key={label}>{label}</span>)}</div></div>
      <div><p className={s.eyebrow}>FITS RIGHT INTO YOUR WORLD</p><h2>Your bio just<br/>got personal.</h2><p>You’ve already built a place for your people. Give them a way to get closer. Share your ReplyPass link anywhere your followers find you.</p><Start className={s.button}>Create your pay-link</Start></div>
    </section>
    <section className={`${s.section} ${s.fees}`} id="fees"><div><p className={s.eyebrow}>YOUR TIME. YOUR PRICE.</p><h2>Make your<br/>attention count.</h2><p>Creating your page is free. You keep {CREATOR_SHARE_PERCENT}% of each paid reply or VIP payment; ReplyPass’s platform share is {PLATFORM_FEE_PERCENT}%.</p><p className={s.fine}>Stripe payment costs are accounted for separately from this platform split. Payouts require Stripe verification and follow its payout schedule.</p><Start className={s.textLink}>Start your page</Start></div><div className={s.percentage}><strong>{CREATOR_SHARE_PERCENT}<span>%</span></strong><span>YOUR SHARE. YOUR POSSIBILITIES.</span></div></section>
    <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>GLAD YOU ASKED</p><h2>A few things<br/>to know.</h2></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}<Icon name="plus" size={18}/></summary><p>{a}</p></details>)}</div></section>
    <section className={s.ending}><p className={s.eyebrow}>YOUR PEOPLE ARE OUT THERE.</p><h2>Give them a way<br/>to get closer.</h2><Start className={s.button}>Claim your ReplyPass link</Start><p>Free to create. Made for you.</p></section>
  </main>;
}
