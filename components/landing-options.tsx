import Image from "next/image";
import Link from "next/link";
import { CreatorLinkStarter } from "@/components/creator-link-starter";
import { RotatingHeroTitle } from "@/components/rotating-hero-title";
import { Icon } from "@/components/icon";
import { CreatorJourneyCarousel } from "@/components/creator-journey-carousel";
import { LandingSectionEngagement } from "@/components/landing-section-engagement";
import { HeroCreatorPreview } from "@/components/hero-creator-preview";
import { CREATOR_SHARE_PERCENT, PLATFORM_FEE_PERCENT, splitPayment } from "@/lib/payments/fees";
import type { SocialPlatform } from "@/lib/creators/socials";
import s from "./landing-options.module.css";

const signup = "/signup?next=%2Fcreator%2Fapply";
export type FeaturedCreator = {
  name: string;
  handle: string;
  photo: string;
  photoPosition?: string;
  photoScale?: number;
  photoCount?: number;
  categories: string[];
  country?: string;
  availability?: "online" | "away" | "offline";
  verified?: boolean;
  messagePriceCents: number | null;
  vipPriceCents: number | null;
  live: boolean;
  bio?: string;
  socials?: Partial<Record<SocialPlatform, string>>;
};

function euros(cents: number, showCents = false) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: showCents ? 2 : 0, maximumFractionDigits: 2 }).format(cents / 100);
}

type CreatorStory = {
  name: string;
  handle: string;
  kind: string;
  photo: string;
  photoPosition?: string;
  phoneScreenshot?: string;
  bio: string;
  messagePriceCents: number | null;
  vipPriceCents: number | null;
  socialBio: string;
  fanQuestion: string;
  creatorReply: string;
  instagram?: { handle: string; posts: string; followers: string; following: string };
};

function CreatorJourney({ story, index }: { story: CreatorStory; index: number }) {
  const creatorShare = story.messagePriceCents === null ? null : splitPayment(story.messagePriceCents).creatorCents;
  const profileUrl = `getreplypass.com/${story.handle}`;
  return <article className={s.creatorJourney}>
    <div className={s.journeyCreator}>
      <div className={s.journeyHeading}><span>0{index + 1} / CREATOR PAGE</span><h3>{story.name}</h3><p>{story.kind}</p></div>
      <div className={`${s.stockPhone} ${story.phoneScreenshot ? s.stockPhoneReal : ""}`} aria-label={`${story.name} ReplyPass page in a phone mockup`}>
        <div className={s.stockPhoneStatus} aria-hidden="true"><span>9:41</span><span className={s.phoneIndicators}><i/><i/><i/></span></div>
        <div className={s.stockPhoneScreen}>
          {story.phoneScreenshot ? <Image className={s.phoneScreenshot} src={story.phoneScreenshot} alt={`${story.name}'s actual ReplyPass profile`} width={1320} height={2297} sizes="(max-width: 540px) 216px, 293px" unoptimized/> : <div className={s.phonePage}>
            <div className={s.phonePageHeader}><strong>replypass<span className={s.brandDot}>.</span></strong><span aria-hidden="true"><Icon name="share" size={14}/></span></div>
            <div className={s.phonePagePhoto}><Image src={story.photo} alt={`${story.name} profile portrait`} fill sizes="(max-width: 540px) 220px, 300px" style={{ objectPosition: story.photoPosition || "center 32%" }} unoptimized={story.photo.startsWith("http")}/><span className={s.phoneAvailability}><i/>Open to requests</span><span className={s.phoneSwipe}>1 / 3 · Swipe</span></div>
            <div className={s.phonePageIdentity}><div><strong>{story.name}</strong><span>@{story.handle}</span></div><div className={s.phonePageTags}>{story.kind.split(" · ").map((kind) => <span key={kind}>{kind}</span>)}</div><p>{story.bio}</p></div>
            <div className={s.phonePageActions}><span><Icon name="message" size={14}/> Message {story.messagePriceCents === null ? "" : euros(story.messagePriceCents)}</span>{story.vipPriceCents !== null && <span><Icon name="sparkles" size={14}/> VIP {euros(story.vipPriceCents)}/mo</span>}</div>
          </div>}
        </div>
        <div className={s.stockPhoneFrame} aria-hidden="true" />
      </div>
    </div>
    <div className={s.journeyFlow}>
      <div className={s.journeyPrice}><span className={s.journeyNumber}>01 / SET YOUR PRICE</span><p>Fans know what a personal reply costs before they ask.</p><strong>{story.messagePriceCents === null ? "Set your own price" : `${euros(story.messagePriceCents)} per Guaranteed Reply`}</strong></div>
      <div className={s.journeySocial}><span className={s.journeyNumber}>02 / PUT YOUR LINK IN BIO</span><p>Give followers a direct way to reach you on Instagram, TikTok, X or your existing link page.</p><div className={s.socialPreview} aria-label={`Instagram bio preview for ${story.name}`}>
        <div className={s.instagramTop}><span aria-hidden="true">‹</span><strong>{story.instagram?.handle ?? "your.instagram"}</strong><span aria-hidden="true">•••</span></div>
        <div className={s.instagramProfile}><div className={s.instagramAvatar}><Image src={story.photo} alt="" fill sizes="64px" style={{ objectPosition: story.photoPosition || "center 32%" }} unoptimized={story.photo.startsWith("http")}/></div><div className={s.instagramStats}><span><b>{story.instagram?.posts ?? "—"}</b> posts</span><span><b>{story.instagram?.followers ?? "—"}</b> followers</span><span><b>{story.instagram?.following ?? "—"}</b> following</span></div></div>
        <div className={s.instagramBio}><strong>{story.name}</strong><small>{story.kind}</small><p>{story.socialBio}</p><div><Icon name="link" size={14}/><span>{profileUrl}</span></div></div>
        <div className={s.instagramActions}><span>Follow</span><span>Message</span></div>
      </div></div>
      <div className={s.journeyConversation}><span className={s.journeyNumber}>03 / REPLY TO A FAN</span><div className={s.chatBubble}><small>FAN ASKS</small><p>{story.fanQuestion}</p></div><div className={`${s.chatBubble} ${s.chatCreator}`}><small>CREATOR REPLIES</small><p>{story.creatorReply}</p></div></div>
      <div className={s.journeyEarnings}><span className={s.journeyNumber}>04 / EARN FROM THE REPLY</span><strong>{creatorShare === null ? "85%" : euros(creatorShare, true)}</strong><p>{creatorShare === null ? "Creator share of a completed reply" : `Creator share of a completed ${euros(story.messagePriceCents!)} reply`} <span>before Stripe fees and adjustments</span></p></div>
    </div>
  </article>;
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

export function LandingOption({ variant, creatorAuthenticated, featuredCreators }: { variant: "studio" | "pop"; creatorAuthenticated: boolean; featuredCreators: FeaturedCreator[] }) {
  const pop = variant === "pop";
  const startHref = creatorAuthenticated ? "/creator/apply" : signup;
  const exampleCompletedReplies = 20;
  const exampleReplyPriceCents = 1500;
  const exampleCreatorShareEuros = exampleCompletedReplies * splitPayment(exampleReplyPriceCents).creatorCents / 100;
  const featuredCreator = featuredCreators[0];
  const creatorStories: CreatorStory[] = [
    { name: featuredCreator.name, handle: featuredCreator.handle.replace(/^@/, ""), kind: featuredCreator.categories.length ? featuredCreator.categories.join(" · ") : "Creator", photo: featuredCreator.photo, photoPosition: featuredCreator.photoPosition, phoneScreenshot: featuredCreator.handle.replace(/^@/, "") === "mimi" && featuredCreator.messagePriceCents === 400 && featuredCreator.vipPriceCents === 1900 ? "/images/mimi-profile-mobile.jpg" : undefined, bio: "A closer place to ask, connect, and keep up with me.", messagePriceCents: featuredCreator.messagePriceCents, vipPriceCents: featuredCreator.vipPriceCents, socialBio: "Ask me a question on ReplyPass. Personal replies, on my terms.", fanQuestion: "What helps you feel ready before a shoot?", creatorReply: "I plan the look, then make space for the moment to happen." },
    { name: "Luna Vale", handle: "lunavale", kind: "Musician", photo: "/images/demo-musician.webp", bio: "Songs in progress and the stories behind them.", messagePriceCents: 1800, vipPriceCents: 900, socialBio: "Music and the stories behind it. Ask me directly on ReplyPass.", fanQuestion: "What inspired your latest song?", creatorReply: "It started with a melody I wrote on the train home.", instagram: { handle: "luna.vale.music", posts: "84", followers: "12.6K", following: "510" } },
    { name: "Nico Reyes", handle: "nicoreyes", kind: "DJ", photo: "/images/demo-dj.webp", bio: "Sets, sounds, and late nights.", messagePriceCents: 2000, vipPriceCents: 1500, socialBio: "Sets, sounds and late nights. Ask me about the music on ReplyPass.", fanQuestion: "How do you build the energy in a set?", creatorReply: "I read the room first, then lift the tempo track by track.", instagram: { handle: "nico.reyes.music", posts: "247", followers: "18.2K", following: "643" } },
    { name: "Nia Solis", handle: "niasolis", kind: "Beauty", photo: "/images/creator-examples/beauty-portrait.avif", photoPosition: "center 26%", bio: "Simple beauty routines that feel like you.", messagePriceCents: 1800, vipPriceCents: 1200, socialBio: "Beauty, routines and the little details. Ask me on ReplyPass.", fanQuestion: "What is your five-minute everyday makeup routine?", creatorReply: "I start with moisturizer, skin tint and cream blush. Those three do most of the work.", instagram: { handle: "nia.solis.beauty", posts: "186", followers: "24.3K", following: "721" } },
    { name: "Zara Mensah", handle: "zaramensah", kind: "Beauty · Style", photo: "/images/creator-examples/beauty-style.avif", photoPosition: "center 28%", bio: "The looks, products and stories behind my style.", messagePriceCents: 2200, vipPriceCents: 1900, socialBio: "Beauty and style, one look at a time. Ask me on ReplyPass.", fanQuestion: "How did you put together the red-and-black look?", creatorReply: "I started with the red dress, then kept the layers and accessories dark and simple.", instagram: { handle: "zara.mensah.style", posts: "312", followers: "31.8K", following: "892" } },
    { name: "Theo Martin", handle: "theomartin", kind: "Fitness", photo: "/images/creator-examples/fitness.avif", photoPosition: "center 32%", bio: "Training habits built for real life.", messagePriceCents: 2500, vipPriceCents: 1900, socialBio: "Training, consistency and finding your pace. Ask me on ReplyPass.", fanQuestion: "How do you stay consistent when work gets busy?", creatorReply: "I plan three short sessions in advance and treat them like appointments.", instagram: { handle: "theo.martin.fit", posts: "149", followers: "16.7K", following: "438" } },
    { name: "Sophie Lane", handle: "sophielane", kind: "Lifestyle", photo: "/images/creator-examples/lifestyle.jpg", photoPosition: "center 28%", bio: "Everyday stories, filming days and little wins.", messagePriceCents: 1600, vipPriceCents: 1400, socialBio: "Life behind the camera. Ask me anything on ReplyPass.", fanQuestion: "How do you make time for filming around work?", creatorReply: "I batch two ideas on Sunday and film them in short windows during the week.", instagram: { handle: "sophie.lane.life", posts: "203", followers: "9,840", following: "566" } },
  ];
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
          <HeroCreatorPreview creators={featuredCreators}/>
          {pop && <><div className={s.floatCard}><span>YOUR ATTENTION HAS VALUE</span><strong>Put a price<br/>on personal.</strong><span className={s.spark}><Icon name="sparkles" size={30}/></span></div><div className={s.floatTag}>Your link. Your rules.</div></>}
        </div>
      </section>
    </div>
    {pop && <div className={s.ticker}><span>CREATORS</span><Icon name="star" size={18}/><span>ARTISTS</span><Icon name="star" size={18}/><span>ATHLETES</span><Icon name="star" size={18}/><span>EXPERTS</span><Icon name="star" size={18}/><span>YOU</span></div>}
    <section id="bio" className={`${s.section} ${s.share}`}>
      <div className={s.linkArt}><span>ONE LINK. EVERYWHERE YOU ARE.</span><strong>getreplypass.com/<em>yourname</em></strong><div>{["Instagram", "TikTok", "YouTube", "Linktree", "Link.me", "Your next post"].map(label=><span key={label}>{label}</span>)}</div></div>
      <div><p className={s.eyebrow}>FITS RIGHT INTO YOUR WORLD</p><h2>Your bio just<br/>got personal.</h2><p>Add your ReplyPass link to Instagram, TikTok, X, Linktree or Link.me. Followers can visit your page directly and choose how to connect.</p><Start href={startHref} className={s.button}>Create your free page</Start></div>
    </section>
    <section className={`${s.section} ${s.how}`} id="how">
      <LandingSectionEngagement sectionId="how" />
      <p className={s.eyebrow}>FROM YOUR SOCIAL BIO TO A PAID REPLY</p><h2>See how ReplyPass works.</h2>
      <div className={s.howCards}>
        <article className={s.howCard}>
          <span className={s.howIndex}>01 / CREATE</span>
          <h3>Make your free profile.</h3>
          <p>Choose your ReplyPass link, add photos and a bio, then set your Replying price. Creating your page is <strong className={s.howHighlight}>Free</strong>; connect Stripe when you’re ready to accept paid requests.</p>
        </article>
        <article className={s.howCard}>
          <span className={s.howIndex}>02 / SHARE</span>
          <h3>Put your link where fans find you.</h3>
          <p>Add your ReplyPass link to any social platform bio or to the link page you already use.</p>
          <p className={s.howPlatforms}><span>Instagram</span> · <span>TikTok</span> · <span>X</span> · <span>YouTube</span> · <span>Linktree</span> · <span>Link.me</span></p>
        </article>
        <article className={s.howCard}>
          <span className={s.howIndex}>03 / EARN</span>
          <h3>Reply and earn.</h3>
          <p>If {exampleCompletedReplies} fans each request a €{exampleReplyPriceCents / 100} Guaranteed Reply and you complete all {exampleCompletedReplies}, your {CREATOR_SHARE_PERCENT}% creator share is: <strong className={s.howAmount}>€{exampleCreatorShareEuros}</strong></p>
          <p className={s.howFine}>Before Stripe processing fees, refunds and other adjustments.</p>
        </article>
      </div>
    </section>
    <section className={`${s.section} ${s.creatorExamples}`} id="examples">
      <div className={s.exampleIntro}><p className={s.eyebrow}>SEE REPLYPASS IN ACTION</p><h2>One link.<br/>From bio to paid reply.</h2><p>See the page a fan opens, the price they see, and the conversation that follows. The same flow works for every kind of creator.</p></div>
      <CreatorJourneyCarousel labels={creatorStories.map((story) => story.name)}>{creatorStories.map((story, index) => <CreatorJourney key={story.name} story={story} index={index}/>)}</CreatorJourneyCarousel>
    </section>
    <section className={`${s.section} ${s.offers}`} id="offers">
      <p className={s.eyebrow}>TWO WAYS TO EARN</p><h2>Give followers a reason to visit.</h2>
      <div className={s.offerGrid}>
        <article><div className={s.conversation}><span>EXAMPLE CONVERSATION</span><p>I love your work. What helped you get started?</p><p>Let’s talk about it. Here’s what I wish I’d known…</p><small>FAN SENDS REQUEST → CREATOR REPLIES → CHARGE COMPLETES</small></div><h3>Guaranteed Replies.</h3><p>Set a price for a personal reply. The fan’s card is temporarily authorized when they ask; you earn after a qualifying reply before the deadline. A decline or missed deadline releases the hold.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></article>
        <article><div className={s.vipArt}><Image src="/images/home-creator-style.avif" alt="" fill sizes="(max-width: 760px) 90vw, 45vw"/><div><span>THE INNER CIRCLE</span><strong>A little more you.</strong><span className={s.vipLabel}><Icon name="star" size={14}/>VIP MEMBERSHIP</span></div></div><h3>VIP memberships.</h3><p>Offer private posts and updates to subscribers at a monthly price you choose. Show fans exactly what is included; memberships renew until canceled.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></article>
      </div>
    </section>
    <section className={`${s.section} ${s.fees}`} id="fees"><div><p className={s.eyebrow}>FREE TO START. CLEAR ABOUT FEES.</p><h2>Set your price.<br/>Keep your share.</h2><p>Creating your page is free. Your creator share is {CREATOR_SHARE_PERCENT}% of each completed paid reply or VIP payment; ReplyPass’s platform share is {PLATFORM_FEE_PERCENT}%.</p><p className={s.fine}>The {CREATOR_SHARE_PERCENT}% is before Stripe processing costs, refunds and other applicable adjustments. Your dashboard shows your earnings and payout status. Bank arrival follows Stripe’s schedule and requires verification.</p><Start href={startHref} className={s.textLink}>Create your free page</Start></div><div className={s.percentage}><strong>{CREATOR_SHARE_PERCENT}<span>%</span></strong><span>CREATOR SHARE BEFORE STRIPE FEES</span></div></section>
    <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>GLAD YOU ASKED</p><h2>A few things<br/>to know.</h2></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}<Icon name="plus" size={18}/></summary><p>{a}</p></details>)}</div></section>
    <section className={s.ending}><p className={s.eyebrow}>YOUR PAGE CAN START TODAY.</p><h2>Give your followers a way<br/>to reach you.</h2><Start href={startHref} className={s.button}>Create your free page</Start><p>Free to create · Set your own prices · No card needed to start</p></section>
  </main>;
}
