"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, splitPayment } from "@/lib/payments/fees";
import s from "./fan-phone-journey.module.css";

type Creator = { name: string; handle: string; kind: string; photo: string; photoPosition?: string; bio: string; messagePriceCents: number | null; vipPriceCents: number | null; fanQuestion: string; creatorReply: string };
type Audience = "fans" | "creator";
const timeline = [
  { actor: "fans", fans: 0, creator: 8, label: "Find your link", caption: "Your fan finds your ReplyPass link in Instagram.", ms: 2800 },
  { actor: "fans", fans: 1, creator: 8, label: "Open your page", caption: "They open your profile and see your reply price.", ms: 2800 },
  { actor: "fans", fans: 2, creator: 8, label: "Ask a question", caption: "They write their question and authorize payment.", ms: 3800 },
  { actor: "fans", fans: 7, creator: 8, label: "Request sent", caption: "Request sent. Their card is authorized while they wait for your reply.", ms: 2000 },
  { actor: "creator", fans: 7, creator: 9, label: "Email arrives", caption: "A new request arrives in your Gmail inbox.", ms: 3200 },
  { actor: "creator", fans: 7, creator: 5, label: "Read the question", caption: "You open the email and read your fan’s question.", ms: 3200 },
  { actor: "creator", fans: 7, creator: 6, label: "Send your reply", caption: "You send a qualifying reply before the request’s deadline.", ms: 3800 },
  { actor: "creator", fans: 3, creator: 4, label: "Reply delivered", caption: "Your fan receives the reply, their payment completes, and you earn your creator share.", ms: 0 },
] as const;
const roleSteps = { fans: [{ index: 0, label: "Find your link" }, { index: 1, label: "Your page" }, { index: 2, label: "Ask a question" }, { index: 3, label: "Request sent" }], creator: [{ index: 4, label: "Email arrives" }, { index: 5, label: "Read request" }, { index: 6, label: "Write reply" }, { index: 7, label: "You earn" }] };
const euros = (cents: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);

export function FanPhoneJourney({ creator }: { creator: Creator }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState({ fans: false, creator: false });
  const creatorPanel = useRef<HTMLDivElement>(null);
  const current = timeline[step];
  const running = !paused && !reduced && visible && inView[current.actor] && step < timeline.length - 1;
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    const update = () => { setReduced(motion.matches); setMobile(narrow.matches); setVisible(document.visibilityState === "visible"); };
    update(); motion.addEventListener("change", update); narrow.addEventListener("change", update); document.addEventListener("visibilitychange", update);
    return () => { motion.removeEventListener("change", update); narrow.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      const next = step + 1;
      setStep(next);
      if (mobile && current.actor === "fans" && timeline[next].actor === "creator") creatorPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, current.ms);
    return () => window.clearTimeout(timer);
  }, [running, step, current, mobile]);
  if (creator.messagePriceCents === null) return null;
  function select(index: number) {
    setPaused(true); setStep(index);
    if (mobile && timeline[index].actor !== current.actor) document.getElementById(`journey-panel-${timeline[index].actor}`)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  }
  function replay() { setStep(0); setPaused(false); if (mobile) document.getElementById("journey-panel-fans")?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" }); }
  return <section id="fan-journey" className={s.section} aria-labelledby="fan-journey-title" data-testid="fan-phone-journey" data-step={step} data-running={running}>
    <div className={s.wrap}>
      <header className={s.copy}><p className={s.kicker}>ONE QUESTION. FROM YOUR FAN TO YOU.</p><h2 id="fan-journey-title">Your fans ask.<br/>You reply. You earn.</h2><p className={s.lead}>Follow one conversation from your fan’s Instagram bio visit to your inbox, reply and earnings.</p></header>
      <div className={s.sharedControls} aria-label="Walkthrough playback">
        <span>0{step + 1} / 0{timeline.length}</span>
        <button type="button" aria-label="Previous step" disabled={step === 0} onClick={() => select(step - 1)}>←</button>
        <button type="button" aria-label="Next step" disabled={step === timeline.length - 1} onClick={() => select(step + 1)}>→</button>
        {step === timeline.length - 1 ? <button type="button" onClick={replay}>Replay walkthrough</button> : !reduced && <button type="button" onClick={() => setPaused(value => !value)}>{paused ? "Play walkthrough" : "Pause walkthrough"}</button>}
        <p aria-live={running ? "off" : "polite"}>{current.caption}</p>
      </div>
      <div className={s.journeys}>
        {(["fans", "creator"] as const).map(role => <RoleJourney key={role} creator={creator} audience={role} scene={current[role]} step={step} running={running} select={select} panelRef={role === "creator" ? creatorPanel : undefined} onInView={value => setInView(previous => previous[role] === value ? previous : { ...previous, [role]: value })}/>)}
      </div>
    </div>
  </section>;
}

function RoleJourney({ creator, audience, scene, step, running, select, panelRef, onInView }: { creator: Creator; audience: Audience; scene: number; step: number; running: boolean; select: (index: number) => void; panelRef?: React.RefObject<HTMLDivElement | null>; onInView: (value: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const reportVisibility = useRef(onInView);
  useEffect(() => { reportVisibility.current = onInView; }, [onInView]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => reportVisibility.current(entry.isIntersecting), { threshold: 0 });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  if (creator.messagePriceCents === null) return null;
  const price = creator.messagePriceCents;
  const share = splitPayment(price).creatorCents;
  const advance = () => select(Math.min(step + 1, timeline.length - 1));
  const sequence = roleSteps[audience];
  const photo = (className: string) => <div className={className}><Image src={creator.photo} alt="" fill sizes="280px" unoptimized={creator.photo.startsWith("http")} style={{ objectFit: "cover", objectPosition: creator.photoPosition || "center 32%" }}/></div>;

  return <div ref={node => { root.current = node; if (panelRef) panelRef.current = node; }} id={`journey-panel-${audience}`} className={s.roleJourney} data-audience={audience} data-scene={scene} data-running={running && timeline[step].actor === audience} role="region" aria-labelledby={`journey-label-${audience}`}>
      <header className={s.roleHeading}><span className={s.roleTag}>{audience === "fans" ? "THE FAN’S EXPERIENCE" : "YOUR EXPERIENCE"}</span><h3 id={`journey-label-${audience}`}>{audience === "fans" ? "Your fans" : "You, the creator"}</h3><p className={s.caption}>{audience === "fans" ? scene === 7 ? "Request sent. Waiting for your reply." : scene === 3 ? "Your reply has arrived. Payment completed." : "Your fan opens your page, asks and authorizes payment." : scene === 8 ? "Your inbox, before the request arrives." : scene === 9 ? "A new request from ReplyPass just arrived." : "Open the request, reply and see what you earned."}</p></header>
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
              <div className={`${s.panel} ${s.pending}`} data-active={scene === 7} aria-hidden={scene !== 7} inert={scene !== 7}>
                <div className={s.rpHeader}><strong>replypass<span>.</span></strong><Icon name="lock" size={16}/></div>
                <div className={s.body}><div className={s.sentIcon}><Icon name="check" size={28}/></div><h3>Request sent.</h3><p className={s.pendingCopy}>Your question is with {creator.name}.</p><div className={s.question}><small>You asked</small><p>{creator.fanQuestion}</p></div><div className={s.price}><span>Card authorized</span><b>{euros(price)}</b></div><p className={s.fine}>You’re charged after a qualifying reply before the deadline. No reply, no charge.</p></div>
              </div>
              <div className={`${s.panel} ${s.gmail}`} data-active={scene === 8 || scene === 9} aria-hidden={scene !== 8 && scene !== 9} inert={scene !== 8 && scene !== 9}>
                <div className={s.gmailHeader}><svg width="26" height="20" viewBox="0 0 24 18" aria-hidden="true"><path d="M2 16V3l10 7L22 3v13" fill="none" stroke="#4285f4" strokeWidth="4"/><path d="M2 3l10 7L22 3" fill="none" stroke="#ea4335" strokeWidth="4"/><path d="M22 3v13" stroke="#34a853" strokeWidth="4"/><path d="M2 3v5" stroke="#fbbc04" strokeWidth="4"/></svg><strong>Gmail</strong></div>
                <div className={s.gmailSearch}><span>☰</span><span>Search in mail</span><span className={s.mailAccount}>{creator.name.charAt(0)}</span></div><div className={s.mailFolder}>PRIMARY</div>
                {scene === 9 && <button type="button" className={s.newEmail} onClick={() => select(5)}><span className={s.senderIcon}>r.</span><span><strong>ReplyPass <small>now</small></strong><b>Chloé asked you a question</b><span>{euros(price)} request · Reply to earn</span></span><i/></button>}
                {[{sender:"Alex Morgan",subject:"Coffee next week?",preview:"Let’s catch up when you’re free.",time:"10:12",color:"#e6d8f2"},{sender:"Studio team",subject:"Friday’s shoot",preview:"The moodboard and call sheet are ready.",time:"09:46",color:"#d5e8fa"},{sender:"The Weekly Edit",subject:"Your weekend reading",preview:"A few things we thought you’d like.",time:"08:30",color:"#f6e4c9"},{sender:"Calendar",subject:"Tomorrow’s schedule",preview:"Your upcoming events, all in one place.",time:"Yesterday",color:"#dfe8d4"}].map(mail => <div className={s.mailRow} key={mail.sender}><span className={s.senderIcon} style={{background:mail.color}}>{mail.sender.charAt(0)}</span><div><strong>{mail.sender}<small>{mail.time}</small></strong><b>{mail.subject}</b><p>{mail.preview}</p></div></div>)}
                {scene === 9 && <div className={s.mailToast}><Icon name="message" size={16}/><div><strong>New request from Chloé</strong><span>ReplyPass · {euros(price)} authorized</span></div></div>}
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
                <div className={s.body}><span className={s.miniLabel}>YOUR EARNINGS</span><h3>One reply.<br/>Real value.</h3><div className={s.amount}><span>Your creator share</span><strong>{euros(share)}</strong><small>{CREATOR_SHARE_PERCENT}% of a {euros(price)} reply</small></div><div className={s.activity}><span className={s.check}><Icon name="check" size={16}/></span><div><strong>Guaranteed Reply</strong><small>Completed · {creator.name}</small></div><b>{euros(share)}</b></div><p className={s.fine}>Example earnings before Stripe processing fees, refunds and adjustments.</p><button className={s.replay} type="button" onClick={() => select(0)}>Back to the start <Icon name="arrow" size={15}/></button></div>
              </div>
            </div>
            <div className={s.browserBar} data-social={scene === 0} aria-hidden="true"><span>⌕</span><span>{scene === 0 ? "Instagram" : (scene === 5 || scene === 8 || scene === 9) ? "Gmail" : audience === "creator" ? "getreplypass.com/creator" : `getreplypass.com/${creator.handle}`}</span><Icon name="share" size={14}/></div>
          </div>
        </div>
        <div className={s.progress} aria-hidden="true">{sequence.map(stage => <i key={stage.label} data-current={step === stage.index}/>)}</div>
      </div>
      <div className={s.roleControls}><div className={s.steps} aria-label={`${audience === "fans" ? "Fan" : "Creator"} walkthrough steps`}>{sequence.map(stage => <button key={stage.label} type="button" aria-pressed={step === stage.index} onClick={() => select(stage.index)}>{stage.label}</button>)}</div></div>
    </div>;
}
