"use client";

import { useEffect } from "react";
import { analyticsAllowed, advertisingAllowed, track } from "@/lib/analytics/client";

export function VipConversion({ membershipId }: { membershipId: string }) {
  useEffect(() => {
    if (!analyticsAllowed() && !advertisingAllowed()) return;
    const key = `replypass:vip-conversion:${membershipId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      track("vip_subscription_active", "vip");
      sessionStorage.setItem(key, "1");
    } catch {
      track("vip_subscription_active", "vip");
    }
  }, [membershipId]);
  return null;
}
