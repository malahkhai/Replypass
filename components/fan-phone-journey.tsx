"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, splitPayment } from "@/lib/payments/fees";
import s from "./fan-phone-journey.module.css";

type Creator = { name: string; handle: string; kind: string; photo: string; photoPosition?: string; bio: string; messagePriceCents: number | null; vipPriceCents: number | null; fanQuestion: string; creatorReply: string };
const stages = [
  { label: "In your bio", caption: "A fan finds your ReplyPass link in your Instagram bio.", ms: 3200 },
  { label: "Your page", caption: "They open your page and see exactly what a personal reply costs.", ms: 3200 },
  { label: "Fan asks", caption: "They send a question. Their card is authorized while they wait for your reply.", ms: 3800 },
  { label: "You reply", caption: "You send a qualifying reply before the deadline. Their payment completes.", ms: 3800 },
  { label: "You earn", caption: "Your creator share appears in your earnings, ready to track through payouts.", ms: 3600 },
];
const euros = (cents: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);

export function FanPhoneJourney({ creator }: { creator: Creator }) {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const running = active && visible && !paused && !reduced;

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
    const timer = window.setTimeout(() => setStep(current => (current + 1) % stages.length), stages[step].ms);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  if (creator.messagePriceCents === null) return null;
  const price = creator.messagePriceCents;
  const share = splitPayment(price).creatorCents;
  function select(index: number) { setPaused(true); setStep(index); }
  function advance() { select(Math.min(step + 1, stages.length - 1)); }
  const photo = (className: string) => <div className={className}><Image src={creator.photo} alt="" fill sizes="280px" unoptimized={creator.photo.startsWith("http")} style={{ objectFit: "cover", objectPosition: creator.photoPosition || "center 32%" }}/></div>;

  return <section ref={root} id="fan-journey" className={s.section} aria-labelledby="fan-journey-title" data-testid="fan-phone-journey" data-step={step} data-running={running}>
    <div className={s.wrap}>
      <div className={s.copy}>
        <p className={s.kicker}>FROM YOUR BIO TO A REAL CONVERSATION</p>
        <h2 id="fan-journey-title">One link.<br/>A little closer.</h2>
        <p className={s.lead}>See how a follower becomes a paid conversation, right from your social bio.</p>
        <p className={s.caption} aria-live={running ? "off" : "polite"}>{stages[step].caption}</p>
        <div className={s.steps} aria-label="Choose a step in the fan journey">{stages.map((stage, index) => <button key={stage.label} type="button" aria-pressed={step === index} onClick={() => select(index)}><span>0{index + 1}</span>{stage.label}</button>)}</div>
        {!reduced && <button className={s.pause} type="button" onClick={() => setPaused(current => !current)}>{paused ? "Play animation" : "Pause animation"}</button>}
      </div>
      <div className={s.stage}>
        <div className={s.phone}>
          <div className={s.screen}>
            <div className={s.status} aria-hidden="true"><span>9:41</span><i/><span>5G ▰</span></div>
            <div className={s.panels}>
              <div className={`${s.panel} ${s.instagram}`} data-active={step === 0} aria-hidden={step !== 0} inert={step !== 0}>
                <div className={s.igHeader}><span>‹</span><strong>Instagram</strong><Icon name="camera" size={20}/></div>
                <div className={s.igIdentity}>{photo(s.igAvatar)}<strong>{creator.name}</strong><span>{creator.kind}</span></div>
                <div className={s.igBio}><p>A little more about my world.</p><p>Ask me a question on ReplyPass ↓</p><button type="button" onClick={advance}><Icon name="link" size={15}/>getreplypass.com/{creator.handle}</button></div>
                <div className={s.igActions}><span>Following</span><span>Message</span></div>
                <div className={s.igTiles} aria-hidden="true">{photo(s.tile)}{photo(s.tile)}{photo(s.tile)}</div>
                <div className={s.tapBio} aria-hidden="true"/>
              </div>
              <div className={`${s.panel} ${s.profile}`} data-active={step === 1} aria-hidden={step !== 1} inert={step !== 1}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><span>My ReplyPass <Icon name="user" size={12}/></span></div>
                <div className={s.cover}>{photo(s.coverPhoto)}<span><i/>Open to requests</span></div>
                <div className={s.identity}><h3>{creator.name}</h3><small>@{creator.handle} · {creator.kind}</small><p>{creator.bio}</p></div>
                <div className={s.profileActions}><button type="button" onClick={advance}><Icon name="message" size={16}/>Message {euros(price)}</button>{creator.vipPriceCents !== null && <span><Icon name="sparkles" size={14}/>VIP {euros(creator.vipPriceCents)}/mo</span>}</div>
                <p className={s.noCharge}>No reply, no charge.</p>
                <div className={s.tapOffer} aria-hidden="true"/>
              </div>
              <div className={`${s.panel} ${s.request}`} data-active={step === 2} aria-hidden={step !== 2} inert={step !== 2}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="lock" size={16}/></div>
                <div className={s.person}>{photo(s.avatar)}<div><strong>{creator.name}</strong><small>Guaranteed Reply</small></div></div>
                <div className={s.body}><span className={s.miniLabel}>SOMETHING YOU’VE WANTED TO ASK</span><h3>A question, just for you.</h3><div className={s.question}><small>Your message</small><p>{creator.fanQuestion}</p><span className={s.cursor} aria-hidden="true"/></div><div className={s.price}><span>Guaranteed Reply</span><b>{euros(price)}</b></div><button className={s.send} type="button" onClick={advance}>Send request <Icon name="arrow" size={16}/></button><p className={s.fine}><Icon name="lock" size={12}/>Card authorized first. Charged after an on-time qualifying reply.</p></div>
              </div>
              <div className={`${s.panel} ${s.conversation}`} data-active={step === 3} aria-hidden={step !== 3} inert={step !== 3}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="message" size={16}/></div>
                <div className={s.person}>{photo(s.avatar)}<div><strong>{creator.name}</strong><small>Your conversation</small></div></div>
                <div className={s.body}><div className={s.fanBubble}><small>Fan asks</small><p>{creator.fanQuestion}</p></div><div className={s.creatorBubble}><small>{creator.name} replies</small><p>{creator.creatorReply}</p></div><div className={s.complete}><Icon name="check" size={16}/>Reply sent · Payment completed</div></div>
              </div>
              <div className={`${s.panel} ${s.earnings}`} data-active={step === 4} aria-hidden={step !== 4} inert={step !== 4}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="wallet" size={17}/></div>
                <div className={s.body}><span className={s.miniLabel}>YOUR EARNINGS</span><h3>One reply.<br/>Real value.</h3><div className={s.amount}><span>Your creator share</span><strong>{euros(share)}</strong><small>{CREATOR_SHARE_PERCENT}% of a {euros(price)} reply</small></div><div className={s.activity}><span className={s.check}><Icon name="check" size={16}/></span><div><strong>Guaranteed Reply</strong><small>Completed · {creator.name}</small></div><b>{euros(share)}</b></div><p className={s.fine}>Example earnings before Stripe processing fees, refunds and adjustments.</p><button className={s.replay} type="button" onClick={() => select(0)}>Watch again <Icon name="arrow" size={15}/></button></div>
              </div>
            </div>
            <div className={s.browserBar} data-social={step === 0} aria-hidden="true"><span>⌕</span><span>{step === 0 ? "Instagram" : `getreplypass.com/${creator.handle}`}</span><Icon name="share" size={14}/></div>
          </div>
        </div>
        <div className={s.progress} aria-hidden="true">{stages.map((stage, index) => <i key={stage.label} data-current={step === index}/>)}</div>
      </div>
    </div>
  </section>;
}
