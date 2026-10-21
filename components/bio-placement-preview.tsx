"use client";

import Image from "next/image";
import { useState } from "react";
import s from "./bio-placement-preview.module.css";

type Platform = "Instagram" | "TikTok" | "X" | "YouTube" | "Linktree" | "Link.me";

const platforms: Platform[] = ["Instagram", "TikTok", "X", "YouTube", "Linktree", "Link.me"];
const replyPassUrl = "getreplypass.com/yourname";

function Avatar({ ring = false }: { ring?: boolean }) {
  return <span className={`${s.avatar} ${ring ? s.avatarRing : ""}`}><Image src="/images/creator-examples/lifestyle.jpg" alt="" fill sizes="48px" /></span>;
}

function LinkLine({ label, button = false }: { label?: string; button?: boolean }) {
  return <div className={button ? s.linkButton : s.linkLine}>
    {label && <span className={s.linkTitle}>{label}</span>}
    <strong>{replyPassUrl}</strong>
  </div>;
}

function Instagram() {
  return <div className={`${s.surface} ${s.dark}`}>
    <div className={s.top}><span className={s.chevron}>‹</span><strong>yourname</strong><span className={s.dots}>···</span></div>
    <div className={s.socialHead}><Avatar ring /><div className={s.stats}><span><b>128</b>posts</span><span><b>8,420</b>followers</span><span><b>613</b>following</span></div></div>
    <div className={s.bio}><b>Your Name</b><small>Digital creator</small><span>Behind the scenes, updates, and a closer way to connect.</span><LinkLine /></div>
    <div className={s.actions}><span>Follow</span><span>Message</span></div>
  </div>;
}

function TikTok() {
  return <div className={`${s.surface} ${s.tiktok}`}>
    <div className={s.top}><span className={s.chevron}>‹</span><strong>yourname</strong><span className={s.dots}>···</span></div>
    <div className={s.centerProfile}><Avatar /><h3>Your Name</h3><span>@yourname</span></div>
    <div className={`${s.stats} ${s.centerStats}`}><span><b>124</b>Following</span><span><b>8,420</b>Followers</span><span><b>42.1K</b>Likes</span></div>
    <div className={s.actions}><span>Follow</span><span>Message</span></div>
    <p className={s.centerBio}>A little more access, on my terms.</p><LinkLine />
  </div>;
}

function XProfile() {
  return <div className={`${s.surface} ${s.xProfile}`}>
    <div className={s.top}><span className={s.chevron}>‹</span><div><strong>Your Name</strong><small>128 posts</small></div><span className={s.dots}>···</span></div>
    <div className={s.xCover} /><div className={s.xIdentity}><Avatar /><span>Follow</span></div>
    <div className={s.bio}><b>Your Name</b><small>@yourname</small><span>Sharing the work and the stories behind it. Ask me directly on ReplyPass.</span><LinkLine /></div>
  </div>;
}

function YouTube() {
  return <div className={`${s.surface} ${s.youtube}`}>
    <div className={s.youtubeCover} /><div className={s.youtubeIdentity}><Avatar /><div><h3>Your Name</h3><span>@yourname · 8.4K subscribers</span></div></div>
    <p>Videos, ideas, and the conversations that follow.</p><LinkLine label="Ask me on ReplyPass" /><div className={s.subscribe}>Subscribe</div>
  </div>;
}

function LinkPage({ brand }: { brand: "Linktree" | "Link.me" }) {
  return <div className={`${s.surface} ${s.linkPage} ${brand === "Link.me" ? s.linkMe : ""}`}>
    <div className={s.linkBrand}>{brand}</div><div className={s.centerProfile}><Avatar /><h3>Your Name</h3><span>@yourname</span></div>
    <p className={s.centerBio}>Everything I share, all in one place.</p>
    <div className={s.linkTiles}><div>Latest videos and updates</div><LinkLine label="Ask me on ReplyPass" button /><div>More from me</div></div>
  </div>;
}

export function BioPlacementPreview() {
  const [selected, setSelected] = useState<Platform>("Instagram");
  return <div className={s.preview}>
    <div className={s.previewHeading}><span>YOUR LINK IN BIO</span><strong>See where fans find you</strong></div>
    <div className={s.tabs} role="tablist" aria-label="Social platform bio preview">
      {platforms.map((platform) => <button key={platform} type="button" role="tab" aria-selected={selected === platform} aria-controls="bio-placement-panel" id={`bio-placement-${platform.toLowerCase().replace(/[^a-z]/g, "")}`} className={selected === platform ? s.active : ""} onClick={() => setSelected(platform)}>{platform}</button>)}
    </div>
    <div id="bio-placement-panel" role="tabpanel" aria-labelledby={`bio-placement-${selected.toLowerCase().replace(/[^a-z]/g, "")}`} className={s.panel}>
      {selected === "Instagram" && <Instagram />}
      {selected === "TikTok" && <TikTok />}
      {selected === "X" && <XProfile />}
      {selected === "YouTube" && <YouTube />}
      {(selected === "Linktree" || selected === "Link.me") && <LinkPage brand={selected} />}
    </div>
    <p className={s.caption}>{selected === "TikTok" ? "TikTok website links require an eligible account; availability varies by region." : selected === "YouTube" ? "Add ReplyPass as a channel profile link." : selected === "X" ? "Add ReplyPass in the separate website field on your profile." : selected === "Instagram" ? "Add ReplyPass in your profile links." : `Add ReplyPass as a link on your ${selected} page.`}</p>
  </div>;
}
