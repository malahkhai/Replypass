"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FeaturedCreator } from "@/components/landing-options";
import { SocialPlatformIcon } from "@/components/creator-socials";
import { Icon } from "@/components/icon";
import { creatorCountry } from "@/lib/creators/countries";
import { socialAudience } from "@/lib/creators/socials";
import s from "./landing-options.module.css";

function price(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function HeroCreatorPreview({ creators }: { creators: FeaturedCreator[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (creators.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setIndex((current) => (current + 1 + Math.floor(Math.random() * (creators.length - 1))) % creators.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [creators.length, paused]);

  const creator = creators[index] || creators[0];
  const country = creatorCountry(creator.country);
  const { links, total, counted } = socialAudience(creator.socials || {}, creator.socialFollowers || {});
  const availability = creator.availability === "away" ? "Replies may take longer" : creator.availability === "offline" ? "Currently away" : "Open to requests";

  return <div className={s.heroPreviewWrap}>
    <div className={s.profile} aria-label={`${creator.name} ReplyPass profile preview`}>
      <div className={s.previewBrand}><strong>replypass<span>.</span></strong><span>My ReplyPass <Icon name="user" size={15}/></span></div>
      <div className={s.portrait}>
        <Image key={creator.photo} src={creator.photo} alt={`${creator.name} profile photo`} fill sizes="(max-width: 760px) 330px, 360px" style={{ objectPosition: creator.photoPosition || "center 35%", transform: `scale(${(creator.photoScale || 100) / 100})` }} unoptimized={creator.photo.startsWith("http")} preload={index === 0}/>
        <span className={s.previewAvailability}><i className={creator.availability === "online" ? s.online : ""}/>{availability}</span>
        <span className={s.previewShare} aria-hidden="true"><Icon name="share" size={16}/></span>
        {creator.photoCount && creator.photoCount > 1 && <span className={s.previewPhotoCount}>1 / {creator.photoCount} · Swipe</span>}
      </div>
      <div className={s.profileBody}>
        <div className={s.previewIdentity}><h2>{creator.name}{creator.verified && <span className={s.previewVerified} aria-label="Verified creator"><Icon name="check" size={11}/></span>}</h2><span>@{creator.handle.replace(/^@/, "")}</span></div>
        <div className={s.previewCategories}>{creator.categories.map((category) => <span key={category}>{category}</span>)}</div>
        {country && <p className={s.previewCountry}><span aria-hidden="true">{country.flag}</span> Country: {country.name}</p>}
        {creator.bio && <p className={s.previewBio}>{creator.bio}</p>}
        {counted > 0 && <p className={s.previewAudience}>{new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(total)} followers across {counted} {counted === 1 ? "account" : "accounts"}</p>}
        {links.length > 0 && <nav className={s.profileSocials} aria-label={`${creator.name} social profiles`}>
          {links.map(({ platform, href, label }) => <a key={platform} className={`${s.socialIcon} ${s[platform]}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} for ${creator.name} (opens in a new tab)`}><SocialPlatformIcon platform={platform}/></a>)}
        </nav>}
      </div>
      <div className={s.previewActions}>
        {creator.messagePriceCents !== null && <span className={s.previewMessage}><Icon name="message" size={16}/> Message {price(creator.messagePriceCents)}</span>}
        {creator.vipPriceCents !== null && <span className={s.previewVip}><Icon name="sparkles" size={15}/> VIP {price(creator.vipPriceCents)}<small>/mo</small></span>}
      </div>
    </div>
    {creators.length > 1 && <div className={s.previewControls} aria-label="Creator preview controls">
      {creators.map((item, itemIndex) => <button key={item.handle} type="button" className={itemIndex === index ? s.previewControlActive : ""} aria-label={`Show ${item.name} profile`} aria-pressed={itemIndex === index} onClick={() => { setIndex(itemIndex); setPaused(true); }}/>) }
      <button type="button" className={s.previewPause} onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume profile rotation" : "Pause profile rotation"}>{paused ? "Play" : "Pause"}</button>
    </div>}
  </div>;
}
