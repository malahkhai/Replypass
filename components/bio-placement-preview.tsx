"use client";

import Image from "next/image";
import { useState } from "react";
import s from "./bio-placement-preview.module.css";

type Platform = "Instagram" | "TikTok" | "X" | "YouTube" | "Link.me";

const profiles: Record<Platform, { image: string; height: number; placement: string }> = {
  Instagram: { image: "/images/bio-previews/instagram.jpg", height: 763, placement: s.instagram },
  TikTok: { image: "/images/bio-previews/tiktok.jpg", height: 2682, placement: s.tiktok },
  X: { image: "/images/bio-previews/x.jpg", height: 988, placement: s.x },
  YouTube: { image: "/images/bio-previews/youtube.jpg", height: 939, placement: s.youtube },
  "Link.me": { image: "/images/bio-previews/linkme.jpg", height: 1422, placement: s.linkme },
};

export function BioPlacementPreview() {
  const [selected, setSelected] = useState<Platform>("Instagram");
  const profile = profiles[selected];

  return <div className={s.preview}>
    <div className={s.tabs} role="tablist" aria-label="Social bio profiles">
      {(Object.keys(profiles) as Platform[]).map((platform) => <button key={platform} type="button" role="tab" id={`bio-placement-${platform.toLowerCase().replace(/[^a-z]/g, "")}`} aria-selected={selected === platform} aria-controls="bio-placement-panel" className={selected === platform ? s.active : ""} onClick={() => setSelected(platform)}>{platform}</button>)}
    </div>
    <div id="bio-placement-panel" role="tabpanel" aria-labelledby={`bio-placement-${selected.toLowerCase().replace(/[^a-z]/g, "")}`} className={s.panel}>
      <div className={`${s.canvas} ${selected === "Link.me" ? s.linkmeCanvas : ""}`} style={{ aspectRatio: `1320 / ${profile.height}` }}>
        <Image src={profile.image} alt={`${selected} bio profile`} width={1320} height={profile.height} sizes="(max-width: 760px) calc(100vw - 48px), 540px" className={s.screenshot} priority={selected === "Instagram"} />
        <span className={`${s.replyPassLink} ${profile.placement}`}>getreplypass.com/yourname</span>
      </div>
    </div>
  </div>;
}
