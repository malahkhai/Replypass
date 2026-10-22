"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CREATOR_SHARE_PERCENT, splitPayment } from "@/lib/payments/fees";
import { canPlayHero, HERO_SCENE_MS, nextHeroFrame, scenesFor, type HeroCreator, type HeroFrame, type HeroScene } from "@/lib/marketing/hero-showcase";
import s from "./animated-hero-showcase.module.css";

const labels: Record<HeroScene, string> = { profile: "Your page", request: "Fans ask", reply: "You earn", vip: "Your VIP" };
const money = (cents: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);

function CreatorPhoto({ creator, cover = false, priority = false }: { creator: HeroCreator; cover?: boolean; priority?: boolean }) {
  return <Image src={creator.photo} alt={cover ? `${creator.name} profile portrait` : ""} fill sizes={cover ? "(max-width: 760px) 310px, 340px" : "44px"} preload={priority} unoptimized={creator.photo.startsWith("http")} style={{ objectFit: "cover", objectPosition: creator.photoPosition || "center 32%" }} />;
}

export function AnimatedHeroShowcase({ creators }: { creators: HeroCreator[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<HeroFrame>({ creator: 0, scene: "profile" });
  const [environment, setEnvironment] = useState({ ready: false, visible: true, inView: false, reduced: true });
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const running = canPlayHero({ ...environment, paused, interacting: hovered || focused });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnvironment(current => ({ ...current, ready: true, visible: document.visibilityState === "visible", reduced: media.matches }));
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(([entry]) => setEnvironment(current => ({ ...current, inView: entry.isIntersecting && entry.intersectionRatio >= 0.25 })), { threshold: [0, 0.25] });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); media.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);

  useEffect(() => {
    if (!running || creators.length === 0) return;
    const timer = window.setTimeout(() => setFrame(current => nextHeroFrame(current, creators)), HERO_SCENE_MS);
    return () => window.clearTimeout(timer);
  }, [running, frame, creators]);

  if (!creators.length) return null;
  const creator = creators[frame.creator] || creators[0];
  // Manual controls remain available when automatic motion is disabled.
  const scenes = scenesFor(creator);
  function select(scene: HeroScene) { setPaused(true); setFrame(current => ({ ...current, scene })); }
  const share = creator.messagePriceCents === null ? null : splitPayment(creator.messagePriceCents).creatorCents;
  return <div ref={root} className={s.showcase} data-testid="hero-showcase" data-scene={frame.scene} data-creator={creator.handle} data-running={running} data-reduced-motion={environment.reduced}
    role="region" aria-label="How ReplyPass works: product preview"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className={s.halo} aria-hidden="true" />
    <div className={s.stack}>
      <div className={s.backplate} aria-hidden="true"/><div className={s.backplateTwo} aria-hidden="true"/>
      <div className={s.device}>
        <div className={s.brand}><strong>replypass<span>.</span></strong><span>My ReplyPass <Icon name="user" size={13}/></span></div>
        <div key={creator.handle} className={s.screens}>
          {scenes.map(scene => <div key={`${creator.handle}-${scene}`} className={s.screen} data-active={scene === frame.scene} aria-hidden={scene !== frame.scene} inert={scene !== frame.scene}>
            {scene === "profile" ? <>
              <div className={s.cover}><CreatorPhoto creator={creator} cover priority={frame.creator === 0}/><span className={s.available}><i/>Open to requests</span><span className={s.share} aria-hidden="true"><Icon name="share" size={14}/></span></div>
              <div className={s.identity}><div><h2>{creator.name}</h2><span>@{creator.handle}</span></div><small>{creator.kind}</small><p>{creator.bio}</p></div>
              <div className={s.offers}><div><Icon name="message" size={19}/><span>Guaranteed Reply<small>A personal reply from me</small></span><b>{creator.messagePriceCents === null ? "Your price" : money(creator.messagePriceCents)}</b></div>{creator.vipPriceCents !== null && <div><Icon name="sparkles" size={19}/><span>VIP membership</span><b>{money(creator.vipPriceCents)}<small>/mo</small></b></div>}</div>
            </> : <>
              <div className={s.person}><div><CreatorPhoto creator={creator}/></div><span><strong>{creator.name}</strong><small>{scene === "vip" ? "VIP membership" : "Guaranteed Reply"}</small></span><Icon name={scene === "vip" ? "sparkles" : "message"} size={20}/></div>
              {scene === "request" && <div className={s.sceneBody}>
                <span className={s.kicker}>A QUESTION, JUST FOR YOU</span><h3>A little more personal.</h3>
                <div className={s.fanBubble}><small>Fan asks</small><p>{creator.fanQuestion}</p></div>
                <div className={s.receipt}><span>Guaranteed Reply</span><strong>{creator.messagePriceCents === null ? "Your price" : money(creator.messagePriceCents)}</strong></div>
                <div className={s.status}><Icon name="lock" size={15}/><span>Request sent · Card authorized</span></div>
                <p className={s.note}>Charged after an on-time qualifying reply. No reply, no charge.</p>
              </div>}
              {scene === "reply" && <div className={s.sceneBody}>
                <div className={`${s.fanBubble} ${s.smallBubble}`}><small>Fan asks</small><p>{creator.fanQuestion}</p></div>
                <div className={s.replyBubble}><small>{creator.name} replies</small><p>{creator.creatorReply}</p></div>
                <div className={s.completed}><Icon name="check" size={16}/> Reply sent · Payment completed</div>
                <div className={s.earning}><span>Your creator share</span><strong>{share === null ? `${CREATOR_SHARE_PERCENT}%` : money(share)}</strong><small>{CREATOR_SHARE_PERCENT}% of {creator.messagePriceCents === null ? "a completed reply" : `a ${money(creator.messagePriceCents)} reply`}</small></div>
                <p className={s.note}>Illustrative earnings, before processing fees and adjustments.</p>
              </div>}
              {scene === "vip" && <div className={s.sceneBody}>
                <span className={s.kicker}>A LITTLE CLOSER</span><h3>Inside my world.</h3><p className={s.vipIntro}>Private posts and updates for my VIPs.</p>
                <div className={s.privatePost}><div className={s.postArt} aria-hidden="true"><Icon name="lock" size={27}/></div><small>PRIVATE UPDATE</small><strong>A moment behind the scenes.</strong><p>A closer look at what I’m working on.</p></div>
                <div className={s.membership}><Icon name="sparkles" size={20}/><strong>VIP membership</strong><span>{money(creator.vipPriceCents!)}<small>/month</small></span></div>
                <p className={s.note}>Renews monthly until canceled.</p>
              </div>}
            </>}
          </div>)}
        </div>
        <div className={s.example}>{creator.illustrative ? "Illustrative creator & interaction" : "Public profile · Illustrative interaction"}</div>
      </div>
    </div>
    <div className={s.controls} aria-label="Product preview controls">
      <div className={s.steps}>{scenes.map((scene, index) => <button key={scene} type="button" aria-label={`Show ${labels[scene]}`} aria-pressed={scene === frame.scene} onClick={() => select(scene)}><span>{String(index + 1).padStart(2, "0")}</span>{labels[scene]}</button>)}</div>
      <button style={{ visibility: environment.reduced ? "hidden" : "visible" }} disabled={environment.reduced} className={s.pause} type="button" aria-label={paused ? "Play product preview" : "Pause product preview"} onClick={() => setPaused(value => !value)}>{paused ? "Play" : "Pause"}</button>
    </div>
  </div>;
}
