"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { metaPixelConfigured, track, trackMetaPage } from "@/lib/analytics/client";
import { analyticsHostAllowed, analyticsPageLocation, CONSENT_KEY, GA_ID, MARKETING_CONSENT_KEY, X_CONSENT_KEY, pageGroup, readChoice } from "@/lib/analytics/model";
const denied = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", functionality_storage: "granted", security_storage: "granted", personalization_storage: "denied" };
let initialized = false;
export function AnalyticsConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);
  const [xChoice, setXChoice] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    try {
      const analytics = readChoice(localStorage.getItem(CONSENT_KEY));
      const marketing = metaPixelConfigured() ? readChoice(localStorage.getItem(MARKETING_CONSENT_KEY)) : false;
      const x = readChoice(localStorage.getItem(X_CONSENT_KEY));
      queueMicrotask(() => {
        setAnalyticsChoice(analytics === true);
        setMarketingChoice(marketing === true);
        setXChoice(x === true);
        setVisible(analytics === null && x === null && (!metaPixelConfigured() || marketing === null));
      });
    }
    catch { queueMicrotask(() => setVisible(true)); }
    const sync = (e: StorageEvent) => { if (e.key === CONSENT_KEY || e.key === MARKETING_CONSENT_KEY || e.key === X_CONSENT_KEY) location.reload(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GA_ENABLED !== "true" || !analyticsHostAllowed(location.hostname)) return;
    const group = pageGroup(pathname);
    const pageLocation = analyticsPageLocation(pathname, location.search);
    if (!initialized) {
      window.dataLayer = window.dataLayer || [];
      // Google gtag requires an arguments object in the dataLayer queue.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("consent", "default", denied);
      try {
        if (readChoice(localStorage.getItem(CONSENT_KEY)) === true)
          window.gtag("consent", "update", { analytics_storage: "granted" });
      } catch { /* Keep analytics storage denied if browser storage is unavailable. */ }
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: pageLocation, page_title: group, page_referrer: "" });
      const script = document.createElement("script");
      script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script); initialized = true;
    }
    window.gtag?.("event", "page_view", { send_to: GA_ID, page_location: pageLocation, page_title: group, page_referrer: "", page_group: group });
  }, [pathname]);
  useEffect(() => { trackMetaPage(pathname); }, [pathname, revision]);
  useEffect(() => {
    try {
      const allowed = readChoice(localStorage.getItem(MARKETING_CONSENT_KEY)) === true;
      const xAllowed = readChoice(localStorage.getItem(X_CONSENT_KEY)) === true;
      void fetch("/api/analytics/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed, xAllowed }),
        keepalive: true,
      });
    } catch { /* Server-side conversion tracking remains disabled. */ }
  }, [pathname, revision]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a[data-creator-cta], a[href="/creator/apply"]');
      if (link) track("creator_cta_click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  function choose(analytics: boolean, marketing: boolean, x: boolean) {
    let hadAnalyticsConsent = false;
    try {
      hadAnalyticsConsent = readChoice(localStorage.getItem(CONSENT_KEY)) === true;
      const at = Date.now();
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: analytics, at }));
      if (metaPixelConfigured()) localStorage.setItem(MARKETING_CONSENT_KEY, JSON.stringify({ accepted: marketing, at }));
      else localStorage.removeItem(MARKETING_CONSENT_KEY);
      localStorage.setItem(X_CONSENT_KEY, JSON.stringify({ accepted: x, at }));
    } catch { /* No persistent storage means optional tracking stays disabled. */ }
    setVisible(false);
    const reloadForWithdrawal = (!analytics && hadAnalyticsConsent) || (!marketing && Boolean(window.fbq)) || (!x && Boolean((window as Window & { twq?: unknown }).twq));
    window.gtag?.("consent", "update", { analytics_storage: analytics ? "granted" : "denied" });
    if (!analytics && initialized) {
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (/^_ga(?:_|$)/.test(name)) for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
      }
    }
    if (!marketing) {
      for (const name of ["_fbp", "_fbc"]) for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
    if (reloadForWithdrawal) location.reload();
    else {
      window.dispatchEvent(new Event("replypass:x-consent-changed"));
      setRevision(v => v + 1);
    }
  }
  return <>
    <div className="cookie-settings"><button type="button" onClick={() => { setCustomizing(true); setVisible(true); }}>Cookie preferences</button></div>
    {visible && <section className="consent-banner" aria-label="Cookie preferences">
      <div><strong>Your privacy choices</strong><p>ReplyPass uses essential storage and sends Google Analytics page-view pings without analytics cookies, even if you ignore or reject this banner. If you choose, analytics cookies help us understand visits, and Meta and X help us measure ads. Advertising tracking stays off until you opt in. <Link href="/privacy">Privacy details</Link></p></div>
      {customizing && <div className="consent-options">
        <label><span><strong>Google Analytics</strong><small>Product usage and performance measurement</small></span><input type="checkbox" checked={analyticsChoice} onChange={event => setAnalyticsChoice(event.target.checked)} /></label>
        {metaPixelConfigured() && <label><span><strong>Meta Pixel &amp; Conversions API</strong><small>Advertising attribution and conversion measurement</small></span><input type="checkbox" checked={marketingChoice} onChange={event => setMarketingChoice(event.target.checked)} /></label>}
        <label><span><strong>X Pixel &amp; Conversions API</strong><small>Advertising attribution and conversion measurement</small></span><input type="checkbox" checked={xChoice} onChange={event => setXChoice(event.target.checked)} /></label>
      </div>}
      {customizing ? <div className="consent-actions"><button type="button" onClick={() => choose(false, false, false)}>Reject optional</button><button type="button" onClick={() => choose(analyticsChoice, marketingChoice, xChoice)}>Save choices</button></div> : <>
        <div className="consent-actions"><button type="button" onClick={() => choose(false, false, false)}>Reject optional</button><button type="button" onClick={() => choose(true, metaPixelConfigured(), true)}>Accept all</button></div>
        <button className="consent-manage" type="button" onClick={() => setCustomizing(true)}>Manage choices</button>
      </>}
    </section>}
  </>;
}
