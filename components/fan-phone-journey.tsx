"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, splitPayment } from "@/lib/payments/fees";
import s from "./fan-phone-journey.module.css";

type Creator = { name: string; handle: string; kind: string; photo: string; photoPosition?: string; bio: string; messagePriceCents: number | null; vipPriceCents: number | null; fanQuestion: string; creatorReply: string };
type Audience = "fans" | "creator";
const stages = {
  fans: [
    { scene: 0, label: "Find your link", caption: "They find your ReplyPass link in your Instagram bio.", ms: 3200 },
    { scene: 1, label: "Open your page", caption: "They see your profile, offers and reply price.", ms: 3200 },
    { scene: 2, label: "Ask a question", caption: "They send a question and authorize payment. Their card is charged after your qualifying reply.", ms: 4200 },
    { scene: 3, label: "Read your reply", caption: "They receive your reply and their payment completes.", ms: 4200 },
  ],
  creator: [
    { scene: 5, label: "Get notified", caption: "You receive a new-request notification with the fan’s question.", ms: 3600 },
    { scene: 6, label: "Write your reply", caption: "You answer on ReplyPass before the request’s deadline.", ms: 4200 },
    { scene: 4, label: "See your earnings", caption: "Your qualifying reply completes the payment and your creator share appears in your earnings.", ms: 3800 },
  ],
};
const euros = (cents: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);

export function FanPhoneJourney({ creator }: { creator: Creator }) {
  const [audience, setAudience] = useState<Audience>("fans");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (creator.messagePriceCents === null) return null;
  return <section id="fan-journey" className={s.section} aria-labelledby="fan-journey-title" data-testid="fan-phone-journey">
    <div className={s.wrap}>
      <header className={s.copy}>
        <p className={s.kicker}>TWO SIDES OF THE SAME CONVERSATION</p>
        <h2 id="fan-journey-title">Your fans ask.<br/>You reply. You earn.</h2>
        <p className={s.lead}>Follow the same question from your fan’s phone to your inbox and earnings.</p>
      </header>
      <div className={s.roleTabs} role="tablist" aria-label="Choose whose experience to see">
        {(["fans", "creator"] as const).map(role => <button key={role} type="button" role="tab" id={`journey-tab-${role}`} aria-controls={`journey-panel-${role}`} aria-selected={audience === role} tabIndex={audience === role ? 0 : -1} onClick={() => setAudience(role)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "fans" : event.key === "End" ? "creator" : role === "fans" ? "creator" : "fans";
          setAudience(next); document.getElementById(`journey-tab-${next}`)?.focus();
        }}>{role === "fans" ? "Your fans" : "You"}</button>)}
      </div>
      <div className={s.journeys}>
        {(["fans", "creator"] as const).map(role => <RoleJourney key={role} creator={creator} audience={role} mobile={mobile} enabled={!mobile || audience === role}/>)}
      </div>
    </div>
  </section>;
}

function RoleJourney({ creator, audience, enabled, mobile }: { creator: Creator; audience: Audience; enabled: boolean; mobile: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const sequence = stages[audience];
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const running = enabled && active && visible && !paused && !reduced;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(document.visibilityState === "visible");
    motion(); visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setStep(current => (current + 1) % sequence.length), sequence[step].ms);
    return () => window.clearTimeout(timer);
  }, [running, step, sequence]);

  if (creator.messagePriceCents === null) return null;
  const price = creator.messagePriceCents;
  const share = splitPayment(price).creatorCents;
  const scene = sequence[step].scene;
  function select(index: number) { setPaused(true); setStep(index); }
  function advance() { select(Math.min(step + 1, sequence.length - 1)); }
  const photo = (className: string) => <div className={className}><Image src={creator.photo} alt="" fill sizes="280px" unoptimized={creator.photo.startsWith("http")} style={{ objectFit: "cover", objectPosition: creator.photoPosition || "center 32%" }}/></div>;

  return <div ref={root} id={`journey-panel-${audience}`} className={s.roleJourney} data-audience={audience} data-hidden={!enabled} data-step={step} data-running={running} role={mobile ? "tabpanel" : "region"} aria-labelledby={mobile ? `journey-tab-${audience}` : `journey-label-${audience}`} aria-hidden={!enabled} inert={!enabled}>
      <header className={s.roleHeading}>
        <span className={s.roleTag}>{audience === "fans" ? "THE FAN’S EXPERIENCE" : "YOUR EXPERIENCE"}</span>
        <h3 id={`journey-label-${audience}`}>{audience === "fans" ? "Your fans" : "You, the creator"}</h3>
        <p className={s.caption} aria-live={running ? "off" : "polite"}>{sequence[step].caption}</p>
      </header>
      <div className={s.stage}>

        <div className={s.phone}>
          <div className={s.screen}>
            <div className={s.status} aria-hidden="true"><span>9:41</span><i/><span>5G ▰</span></div>
            <div className={s.panels}>
              <div className={`${s.panel} ${s.instagram}`} data-active={scene === 0} aria-hidden={scene !== 0} inert={scene !== 0}>
                <div className={s.igHeader}><span>‹</span><strong>Instagram</strong><Icon name="camera" size={20}/></div>
                <div className={s.igIdentity}>{photo(s.igAvatar)}<strong>{creator.name}</strong><span>{creator.kind}</span></div>
                <div className={s.igBio}><p>A little more about my world.</p><p>Ask me a question on ReplyPass ↓</p><button type="button" onClick={advance}><Icon name="link" size={15}/>getreplypass.com/{creator.handle}</button></div>
                <div className={s.igActions}><span>Following</span><span>Message</span></div>
                <div className={s.igTiles} aria-hidden="true">{photo(s.tile)}{photo(s.tile)}{photo(s.tile)}</div>
                <div className={s.tapBio} aria-hidden="true"/>
              </div>
              <div className={`${s.panel} ${s.profile}`} data-active={scene === 1} aria-hidden={scene !== 1} inert={scene !== 1}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><span>My ReplyPass <Icon name="user" size={12}/></span></div>
                <div className={s.cover}>{photo(s.coverPhoto)}<span><i/>Open to requests</span></div>
                <div className={s.identity}><h3>{creator.name}</h3><small>@{creator.handle} · {creator.kind}</small><p>{creator.bio}</p></div>
                <div className={s.profileActions}><button type="button" onClick={advance}><Icon name="message" size={16}/>Message {euros(price)}</button>{creator.vipPriceCents !== null && <span><Icon name="sparkles" size={14}/>VIP {euros(creator.vipPriceCents)}/mo</span>}</div>
                <p className={s.noCharge}>No reply, no charge.</p>
                <div className={s.tapOffer} aria-hidden="true"/>
              </div>
              <div className={`${s.panel} ${s.request}`} data-active={scene === 2} aria-hidden={scene !== 2} inert={scene !== 2}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="lock" size={16}/></div>
                <div className={s.person}>{photo(s.avatar)}<div><strong>{creator.name}</strong><small>Guaranteed Reply</small></div></div>
                <div className={s.body}><span className={s.miniLabel}>SOMETHING YOU’VE WANTED TO ASK</span><h3>A question, just for you.</h3><div className={s.question}><small>Your message</small><p>{creator.fanQuestion}</p><span className={s.cursor} aria-hidden="true"/></div><div className={s.price}><span>Guaranteed Reply</span><b>{euros(price)}</b></div><button className={s.send} type="button" onClick={advance}>Send request <Icon name="arrow" size={16}/></button><p className={s.fine}><Icon name="lock" size={12}/>Card authorized first. Charged after an on-time qualifying reply.</p></div>
              </div>
              <div className={`${s.panel} ${s.conversation}`} data-active={scene === 3} aria-hidden={scene !== 3} inert={scene !== 3}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="message" size={16}/></div>
                <div className={s.person}>{photo(s.avatar)}<div><strong>{creator.name}</strong><small>Your conversation</small></div></div>
                <div className={s.body}><div className={s.fanBubble}><small>You asked</small><p>{creator.fanQuestion}</p></div><div className={s.creatorBubble}><small>{creator.name} replies</small><p>{creator.creatorReply}</p></div><div className={s.complete}><Icon name="check" size={16}/>Reply received · Charged {euros(price)}</div></div>
              </div>
              <div className={`${s.panel} ${s.notification}`} data-active={scene === 5} aria-hidden={scene !== 5} inert={scene !== 5}>
                <div className={s.rpHeader}><strong>Inbox</strong><Icon name="message" size={16}/></div>
                <div className={s.body}><span className={s.miniLabel}>NEW REQUEST · REPLYPASS</span><h3>A fan has a question.</h3><div className={s.email}><div className={s.emailBrand}>r<span>.</span></div><div><strong>ReplyPass</strong><small>to {creator.name}</small></div></div><div className={s.question}><small>Chloé asks</small><p>{creator.fanQuestion}</p></div><p className={s.notificationText}>A {euros(price)} request is waiting. Reply before the request’s deadline to earn your share.</p><button className={s.send} type="button" onClick={advance}>Open request <Icon name="arrow" size={16}/></button></div>
              </div>
              <div className={`${s.panel} ${s.composer}`} data-active={scene === 6} aria-hidden={scene !== 6} inert={scene !== 6}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="message" size={16}/></div>
                <div className={s.person}><span className={s.fanAvatar}>C</span><div><strong>Reply to Chloé</strong><small>Guaranteed Reply · {euros(price)}</small></div></div>
                <div className={s.body}><div className={s.fanBubble}><small>Chloé asks</small><p>{creator.fanQuestion}</p></div><div className={s.replyDraft}><small>Your reply</small><p>{creator.creatorReply}</p><span className={s.cursor} aria-hidden="true"/></div><button className={s.send} type="button" onClick={advance}>Send reply <Icon name="arrow" size={16}/></button><p className={s.fine}>Send a qualifying reply before the request’s deadline to complete payment.</p></div>
              </div>
              <div className={`${s.panel} ${s.earnings}`} data-active={scene === 4} aria-hidden={scene !== 4} inert={scene !== 4}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="wallet" size={17}/></div>
                <div className={s.body}><span className={s.miniLabel}>YOUR EARNINGS</span><h3>One reply.<br/>Real value.</h3><div className={s.amount}><span>Your creator share</span><strong>{euros(share)}</strong><small>{CREATOR_SHARE_PERCENT}% of a {euros(price)} reply</small></div><div className={s.activity}><span className={s.check}><Icon name="check" size={16}/></span><div><strong>Guaranteed Reply</strong><small>Completed · {creator.name}</small></div><b>{euros(share)}</b></div><p className={s.fine}>Example earnings before Stripe processing fees, refunds and adjustments.</p><button className={s.replay} type="button" onClick={() => select(0)}>Watch again <Icon name="arrow" size={15}/></button></div>
              </div>
            </div>
            <div className={s.browserBar} data-social={scene === 0} aria-hidden="true"><span>⌕</span><span>{scene === 0 ? "Instagram" : scene === 5 ? "Mail" : audience === "creator" ? "getreplypass.com/creator" : `getreplypass.com/${creator.handle}`}</span><Icon name="share" size={14}/></div>
          </div>
        </div>
        <div className={s.progress} aria-hidden="true">{sequence.map((stage, index) => <i key={stage.label} data-current={step === index}/>)}</div>
      </div>
      <div className={s.roleControls}>
        <div className={s.steps} aria-label={`${audience === "fans" ? "Fan" : "Creator"} walkthrough steps`}>{sequence.map((stage, index) => <button key={stage.label} type="button" aria-pressed={step === index} onClick={() => select(index)}><span>0{index + 1}</span>{stage.label}</button>)}</div>
        {!reduced && <button className={s.pause} type="button" onClick={() => setPaused(current => !current)}>{paused ? "Play animation" : "Pause animation"}</button>}
      </div>
    </div>;
}
