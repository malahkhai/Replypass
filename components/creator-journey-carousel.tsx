"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { track as trackEvent } from "@/lib/analytics/client";
import s from "./landing-options.module.css";

export function CreatorJourneyCarousel({ labels, children }: { labels: string[]; children: ReactNode[] }) {
  const track = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const featuredViewed = useRef(false);

  function show(index: number) {
    const next = (index + labels.length) % labels.length;
    const element = track.current;
    if (!element) return;
    setActive(next);
    trackEvent("creator_use_case_selected", next + 1);
    element.scrollTo({ left: next * element.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  useEffect(() => {
    if (featuredViewed.current || active !== 0 || !track.current || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      featuredViewed.current = true;
      trackEvent("featured_creator_viewed", "creator");
      observer.disconnect();
    }, { rootMargin: "0px 0px -25% 0px" });
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    const container = tabs.current;
    const selected = container?.children[active] as HTMLElement | undefined;
    if (!container || !selected) return;
    container.scrollTo({ left: selected.offsetLeft - container.offsetLeft - (container.clientWidth - selected.clientWidth) / 2, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (!playing || labels.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element) return;
      const next = (Math.round(element.scrollLeft / element.clientWidth) + 1) % labels.length;
      element.scrollTo({ left: next * element.clientWidth, behavior: "smooth" });
      setActive(next);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [active, labels.length, playing]);

  function syncActive() {
    const element = track.current;
    if (element) setActive(Math.round(element.scrollLeft / element.clientWidth));
  }

  return <div className={s.creatorCarousel} role="region" aria-roledescription="carousel" aria-label="Creator journeys">
    <div className={s.carouselToolbar}>
      <div className={s.carouselTabs} aria-label="Choose a creator" ref={tabs}>
        {labels.map((label, index) => <button key={label} type="button" className={index === active ? s.carouselTabActive : ""} aria-current={index === active ? "true" : undefined} onClick={() => show(index)}>{label}</button>)}
      </div>
      <div className={s.carouselControls}>
        <span aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(labels.length).padStart(2, "0")}</span>
        <button type="button" aria-label="Previous creator" onClick={() => show(active - 1)}><Icon name="arrow" size={17}/></button>
        <button type="button" aria-label="Next creator" onClick={() => show(active + 1)}><Icon name="arrow" size={17}/></button>
        <button type="button" className={s.carouselPause} aria-label={playing ? "Pause automatic rotation" : "Resume automatic rotation"} onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
      </div>
    </div>
    <div className={s.carouselTrack} ref={track} onScroll={syncActive}>
      {children.map((child, index) => <div className={s.carouselSlide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${labels.length}: ${labels[index]}`} aria-hidden={index !== active} key={labels[index]}>{child}</div>)}
    </div>
  </div>;
}
