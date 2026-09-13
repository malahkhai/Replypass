"use client";

import {
  analyticsHostAllowed,
  CONSENT_KEY,
  GA_ID,
  MARKETING_CONSENT_KEY,
  pageGroup,
  readChoice,
  validMetaPixelId,
} from "./model";

type AnalyticsEvent =
  | "creator_cta_click"
  | "interaction_select"
  | "login"
  | "signup_submitted"
  | "creator_onboarding_start"
  | "creator_onboarding_step"
  | "creator_launch_success"
  | "checkout_started";

type MetaPixel = ((command: string, event: string, parameters?: Record<string, unknown>) => void) & {
  callMethod?: (...args: unknown[]) => void;
  push: MetaPixel;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
  }
}

export function analyticsAllowed() {
  try {
    return process.env.NEXT_PUBLIC_GA_ENABLED === "true" && analyticsHostAllowed(location.hostname) && readChoice(localStorage.getItem(CONSENT_KEY)) === true;
  } catch { return false; }
}

export function advertisingAllowed() {
  try {
    return metaPixelConfigured() && analyticsHostAllowed(location.hostname) && readChoice(localStorage.getItem(MARKETING_CONSENT_KEY)) === true;
  } catch { return false; }
}

export function metaPixelConfigured() {
  return process.env.NEXT_PUBLIC_META_ENABLED === "true" && validMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
}

export function initializeMetaPixel() {
  if (!advertisingAllowed() || window.fbq) return;
  const pixel = function (...args: unknown[]) {
    if (pixel.callMethod) pixel.callMethod(...args);
    else pixel.queue.push(args);
  } as MetaPixel;
  pixel.queue = [];
  pixel.push = pixel;
  pixel.loaded = true;
  pixel.version = "2.0";
  window.fbq = window._fbq = pixel;
  pixel("init", process.env.NEXT_PUBLIC_META_PIXEL_ID!);
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

export function trackMetaPage(pathname: string) {
  if (!advertisingAllowed()) return;
  initializeMetaPixel();
  window.fbq?.("track", "PageView");
  if (pageGroup(pathname) === "creator_profile") window.fbq?.("track", "ViewContent", { content_category: "creator_profile" });
}

export function track(event: AnalyticsEvent, option?: string | number) {
  const allowed = ["fan", "creator", "message", "live_chat", "voice_note", "photo", "video", "vip", 1, 2, 3, 4, 5];
  const safeOption = allowed.includes(option as string | number) ? option : undefined;
  if (analyticsAllowed()) {
    window.gtag?.("event", event, {
      send_to: GA_ID,
      page_location: `https://getreplypass.com/${pageGroup(location.pathname)}`,
      page_title: pageGroup(location.pathname), page_referrer: "",
      page_group: pageGroup(location.pathname),
      ...(safeOption !== undefined ? { funnel_detail: safeOption } : {}),
    });
  }
  if (!advertisingAllowed()) return;
  initializeMetaPixel();
  const detail = safeOption !== undefined ? { content_category: safeOption } : undefined;
  const metaEvents: Record<AnalyticsEvent, { mode: "track" | "trackCustom"; name: string }> = {
    creator_cta_click: { mode: "trackCustom", name: "CreatorCTAClick" },
    interaction_select: { mode: "trackCustom", name: "InteractionSelect" },
    login: { mode: "trackCustom", name: "Login" },
    signup_submitted: { mode: "trackCustom", name: "SignupSubmitted" },
    creator_onboarding_start: { mode: "track", name: "Lead" },
    creator_onboarding_step: { mode: "trackCustom", name: "CreatorOnboardingStep" },
    creator_launch_success: { mode: "track", name: "CompleteRegistration" },
    checkout_started: { mode: "track", name: "InitiateCheckout" },
  };
  const mapped = metaEvents[event];
  window.fbq?.(mapped.mode, mapped.name, detail);
}
