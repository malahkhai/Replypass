"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { showcaseCreators } from "./creator-showcase-data";
import s from "./creator-showcase.module.css";

const words = ["models", "DJs", "lawyers", "poets", "coaches", "chefs", "beauty creators", "dancers"];
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getVisibility = () => !document.hidden;
const serverReducedMotion = () => true;
const serverVisibility = () => false;

type Social = typeof showcaseCreators[number]["socials"][number];
const socialLabels: Record<Social, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X", facebook: "Facebook", linkedin: "LinkedIn", spotify: "Spotify" };
function SocialMark({ platform }: { platform: Social }) {
  const paths: Record<Social, React.ReactNode> = {
    instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></>,
    facebook: <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.6V3.4c-.3 0-1.2-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4v2.4H7.8V13h2.7v8z" fill="currentColor" stroke="none"/>,
    linkedin: <path d="M4.5 9h3.4v11H4.5zM6.2 3.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h3.2v1.6c.5-.9 1.7-1.8 3.4-1.8 3.4 0 4 2.2 4 5.1V20h-3.4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20H10z" fill="currentColor" stroke="none"/>,
    spotify: <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M7 9.5c3.5-1 7-.7 10 1M7.8 12.7c3-.8 5.8-.5 8.2.9M8.6 15.7c2.4-.6 4.4-.4 6.4.7"/></>,
    tiktok: <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.3 2.3 1.9 3.9 4.5 4.1"/>,
    youtube: <><rect x="2.5" y="6" width="19" height="12" rx="3.5" fill="currentColor" stroke="none"/><path d="M10 9.5v5l4.5-2.5z" fill="#fff" stroke="none"/></>,
    x: <path d="M4 3h3.5L20 21h-3.5L4 3Zm16 0L4 21"/>,
  };
  return <span title={socialLabels[platform]} data-platform={platform}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={socialLabels[platform]}>{paths[platform]}</svg></span>;
}

function CreatorPhone({ creator }: { creator: typeof showcaseCreators[number] }) {
  return <article className={s.phone} aria-label={`${creator.name}, ${creator.category}, reply price ${creator.replyPrice} euros`}>
    <div className={s.screen}>
      <span className={s.island} aria-hidden="true"/>
      <div className={s.status} aria-hidden="true"><span>9:41</span><svg width="52" height="12" viewBox="0 0 52 12"><path d="M1 8h2v3H1zM5 6h2v5H5zM9 4h2v7H9zM13 2h2v9h-2z" fill="currentColor"/><rect x="24.5" y="1.5" width="20" height="9" rx="3" fill="none" stroke="currentColor"/><rect x="26.5" y="3.5" width="12" height="5" rx="1.5" fill="currentColor"/><rect x="46" y="4" width="1.8" height="4" rx=".9" fill="currentColor"/></svg></div>
      <div className={s.phoneHeader}><span className={s.wordmark}>replypass<i>.</i></span><span className={s.share} aria-hidden="true"><Icon name="share" size={13}/></span></div>
      <div className={s.portrait}>
        <Image src={creator.image} alt={`Portrait of ${creator.name}`} fill sizes="238px" style={{ objectPosition: creator.imagePosition }} unoptimized/>
        <span className={s.badge}>Open to requests</span><span className={s.swipe}>1 / 3 · Swipe</span>
      </div>
      <div className={s.identity}><b>{creator.name}</b><span className={s.handle}>@{creator.handle}</span></div>
      <div className={s.meta}><span className={s.tag}>{creator.category}</span><span className={s.country}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>{creator.country}</span></div>
      <div className={s.socials}>{creator.socials.map(platform => <SocialMark key={platform} platform={platform}/>)}</div>
      <p className={s.bio}>{creator.bio}</p>
      <div className={s.caption}>Guaranteed Reply</div>
      <div className={s.offers} data-vip={creator.vipPrice !== null}><span className={s.message}><Icon name="message" size={13}/>Message €{creator.replyPrice}</span>{creator.vipPrice !== null && <span className={s.vip}><Icon name="sparkles" size={13}/>VIP €{creator.vipPrice}/mo</span>}</div>
    </div>
  </article>;
}

export function CreatorShowcase({ startHref }: { startHref: string }) {
  const section = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [word, setWord] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, serverReducedMotion);
  const visible = useSyncExternalStore(subscribeVisibility, getVisibility, serverVisibility);
  const running = inView && visible && playing && !interacting && !reducedMotion;

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setWord(current => (current + 1) % words.length), 2200);
    return () => window.clearInterval(timer);
  }, [running]);

  return <section ref={section} id="creator-showcase" className={s.section} aria-labelledby="creator-showcase-title" data-running={running}>
    <div className={s.inner}>
      <header className={s.heading}>
        <span className={s.wordmark}>replypass<i>.</i></span>
        <h2 id="creator-showcase-title" className={s.title}>One pay-link in bio for <span className={s.accessibleWord}>creators</span><span className={s.word} key={word} aria-hidden="true">{reducedMotion ? "creators" : words[word]}</span></h2>
        <p className={s.subtitle}>From the runway to the studio, make room for the questions only you can answer.</p>
        <Link className={s.cta} href={startHref} data-creator-cta>Create your page <Icon name="arrow" size={15}/></Link>
      </header>
      <div className={s.row} tabIndex={0} role="region" aria-label="Example creator profiles" onPointerEnter={event => { if (event.pointerType === "mouse") setInteracting(true); }} onPointerLeave={() => setInteracting(false)} onFocus={() => setInteracting(true)} onBlur={() => setInteracting(false)}>
        <div className={s.track}>
          {[false, true].map(duplicate => <div className={s.set} key={String(duplicate)} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>{showcaseCreators.map(creator => <CreatorPhone key={creator.handle} creator={creator}/>)}</div>)}
        </div>
      </div>
      {!reducedMotion && <footer className={s.footer}><button type="button" className={s.toggle} aria-pressed={!playing} aria-label={playing ? "Pause creator showcase" : "Play creator showcase"} onClick={() => setPlaying(current => !current)}>{playing ? "Pause" : "Play"}</button></footer>}
    </div>
  </section>;
}
