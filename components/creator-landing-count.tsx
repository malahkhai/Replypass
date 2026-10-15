"use client";

import { useEffect } from "react";
import { analyticsHostAllowed } from "@/lib/analytics/model";

export function CreatorLandingCount() {
  useEffect(() => {
    if (!analyticsHostAllowed(location.hostname)) return;
    void fetch("/api/analytics/creator-landing", { method: "POST", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true }).catch(() => {});
  }, []);
  return null;
}
