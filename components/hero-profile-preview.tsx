"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeaturedCreator } from "@/components/landing-options";
import { Icon } from "@/components/icon";
import { safeSocialUrl, socialPlatforms, type SocialPlatform } from "@/lib/creators/socials";
import s from "./landing-options.module.css";

type Preview = {
  name: string;
  handle: string;
  photo: string;
  photoPosition?: string;
  categories: string[];
  bio: string;
  priceCents: number | null;
  vipPriceCents: number | null;
  socials?: Partial<Record<SocialPlatform, string>>;
};

function price(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const paths: Record<SocialPlatform, React.ReactNode> = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></>,
    tiktok: <path d="M14 3v11.1a4.3 4.3 0 1 1-4.3-4.3M14 3c.6 3.2 2.7 5.2 6 5.4" />,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>,
    twitter: <path d="M4 3h3.5L20 21h-3.5L4 3Zm16 0L4 21" />,
    website: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[platform]}</svg>;
}

export function HeroProfilePreview({ featuredCreator }: { featuredCreator: FeaturedCreator }) {
  const [selected, setSelected] = useState<"mimi" | "dj">("mimi");
  const mimi: Preview = {
    name: featuredCreator.name,
    handle: featuredCreator.handle.replace(/^@/, ""),
    photo: featuredCreator.photo,
    photoPosition: featuredCreator.photoPosition,
    categories: featuredCreator.categories,
    bio: featuredCreator.bio || "A little closer to Mimi.",
    priceCents: featuredCreator.messagePriceCents,
    vipPriceCents: featuredCreator.vipPriceCents,
    socials: featuredCreator.socials,
  };
  const dj: Preview = {
    name: "Nico Reyes",
    handle: "nicoreyes",
    photo: "/images/demo-dj.webp",
    photoPosition: "center 32%",
    categories: ["DJ"],
    bio: "Sets, sounds, and late nights. Ask me about the music.",
    priceCents: 2000,
    vipPriceCents: 1500,
  };
  const creator = selected === "mimi" ? mimi : dj;
  const actualSocials = (Object.keys(socialPlatforms) as SocialPlatform[]).flatMap(platform => {
    const href = safeSocialUrl(platform, creator.socials?.[platform] || "");
    return href ? [platform] : [];
  });
  return <div className={s.heroShowcase} aria-label="ReplyPass creator profile preview">
    <div className={s.heroShowcaseTabs} role="group" aria-label="Choose a profile preview">
      <button type="button" aria-pressed={selected === "mimi"} onClick={() => setSelected("mimi")}>Mimi_Kiki</button>
      <button type="button" aria-pressed={selected === "dj"} onClick={() => setSelected("dj")}>DJ</button>
    </div>
    <div className={s.heroProfileCard} key={selected}>
      <div className={s.heroProfileNav}><strong>replypass<span>.</span></strong><span>My ReplyPass <Icon name="user" size={14} /></span></div>
      <div className={s.heroProfilePhoto}>
        <Image src={creator.photo} alt={`${creator.name} profile photo`} fill sizes="(max-width: 760px) 85vw, 430px" style={{ objectPosition: creator.photoPosition || "center 35%" }} unoptimized={creator.photo.startsWith("http")} preload={selected === "mimi"}/>
        <span className={s.heroAvailability}><i/> Open to requests</span>
        <span className={s.heroPhotoCaption}>A LITTLE CLOSER TO {creator.name.toUpperCase()}</span>
      </div>
      <div className={s.heroProfileDetails}>
        <div className={s.heroProfileName}><strong>{creator.name}</strong><span>@{creator.handle}</span></div>
        <div className={s.heroProfileCategories}>{creator.categories.map(category => <span key={category}>{category}</span>)}</div>
        <p>{creator.bio}</p>
        <div className={s.heroSocials} aria-label="Social icons on a ReplyPass profile">{(actualSocials.length > 0 ? actualSocials : ["instagram", "tiktok", "twitter"] as const).map(platform => <span key={platform} title={socialPlatforms[platform].label}><SocialIcon platform={platform}/></span>)}</div>
      </div>
      <div className={s.heroProfileOffers}>
        <span className={s.heroMessageOffer}><Icon name="message" size={17}/>{creator.priceCents === null ? "Set your reply price" : `Get a Guaranteed Reply · ${price(creator.priceCents)}`}</span>
        {creator.vipPriceCents !== null && <span className={s.heroVipOffer}><Icon name="sparkles" size={17}/> VIP {price(creator.vipPriceCents)}/mo</span>}
      </div>
    </div>
    <p className={s.heroProfileUrl}>getreplypass.com/{creator.handle}</p>
  </div>;
}
