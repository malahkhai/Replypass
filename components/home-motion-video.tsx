"use client";

import { useEffect, useRef, useState } from "react";
import s from "./landing-options.module.css";

type Asset = "creator-page" | "social-to-reply" | "creator-earnings";

export function HomeMotionVideo({ asset, label }: { asset: Asset; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(element);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    update();
    updateVisibility();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (inView && !paused && !reducedMotion && pageVisible) {
      void element.play().catch(() => { /* The poster remains visible if autoplay is unavailable. */ });
    } else {
      element.pause();
    }
  }, [inView, paused, reducedMotion, pageVisible]);

  return <div className={s.howMedia}>
    <video ref={video} muted loop playsInline preload="none" poster={`/videos/${asset}-poster.webp`} aria-hidden="true">
      <source src={`/videos/${asset}.mp4`} type="video/mp4" />
    </video>
    {!reducedMotion && <button className={s.howMediaControl} type="button" onClick={() => setPaused((value) => !value)} aria-label={`${paused ? "Play" : "Pause"} ${label} animation`}>{paused ? "Play" : "Pause"}</button>}
  </div>;
}
