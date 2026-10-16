"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberCampaign } from "@/lib/analytics/campaign";

export function CampaignCapture() {
  const pathname = usePathname();
  useEffect(() => { rememberCampaign(location.search); }, [pathname]);
  return null;
}
