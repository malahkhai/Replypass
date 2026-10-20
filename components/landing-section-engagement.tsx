"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

export function LandingSectionEngagement({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      track("how_it_works_engaged");
      observer.disconnect();
    }, { rootMargin: "0px 0px -35% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionId]);
  return null;
}
