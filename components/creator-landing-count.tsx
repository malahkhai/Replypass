"use client";

import { useEffect } from "react";
import { analyticsHostAllowed } from "@/lib/analytics/model";
import { campaignFromSearch } from "@/lib/analytics/campaign";

export function CreatorLandingCount() {
  useEffect(() => {
    if (!analyticsHostAllowed(location.hostname)) return;
    void fetch("/api/analytics/creator-landing", {
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignFromSearch(location.search)), keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
