"use client";

import { useEffect, useState } from "react";
import s from "./landing-options.module.css";

const phrases = [
  "Get paid for replies.",
  "Set your reply price.",
  "Offer VIP membership.",
  "Earn from conversations.",
];

export function RotatingHeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % phrases.length);
    }, 3800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <h1 className={s.rotatingTitle} aria-label="Get paid for Guaranteed Replies and VIP memberships with your ReplyPass link.">
      <span className={s.rotatingLine} aria-hidden="true" key={index}>{phrases[index]}</span>
      <span className={s.fixedLine} aria-hidden="true">With your pay-link in bio.</span>
    </h1>
  );
}
