"use client";

import { useEffect, useState } from "react";
import s from "./landing-options.module.css";

const phrases = [
  "Get paid for replies.",
  "Make your access count.",
  "Earn on your terms.",
  "Bring fans closer.",
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
    <h1 className={s.rotatingTitle} aria-label="Get paid for replies with the best pay-link in bio.">
      <span className={s.rotatingLine} aria-hidden="true" key={index}>{phrases[index]}</span>
      <span className={s.fixedLine} aria-hidden="true">With the best pay-link in bio.</span>
    </h1>
  );
}
