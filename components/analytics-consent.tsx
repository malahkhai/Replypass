"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsAllowed, metaPixelConfigured, track, trackMetaPage } from "@/lib/analytics/client";
import { CONSENT_KEY, GA_ID, MARKETING_CONSENT_KEY, pageGroup, readChoice } from "@/lib/analytics/model";
const denied = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
let initialized = false;
export function AnalyticsConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    try {
      const analytics = readChoice(localStorage.getItem(CONSENT_KEY));
      const marketing = metaPixelConfigured() ? readChoice(localStorage.getItem(MARKETING_CONSENT_KEY)) : false;
      queueMicrotask(() => {
        setAnalyticsChoice(analytics === true);
        setMarketingChoice(marketing === true);
        if (analytics === null || marketing === null) setVisible(true);
      });
    }
    catch { queueMicrotask(() => setVisible(true)); }
    const sync = (e: StorageEvent) => { if (e.key === CONSENT_KEY || e.key === MARKETING_CONSENT_KEY) location.reload(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!analyticsAllowed()) return;
    const group = pageGroup(pathname);
    if (!initialized) {
      window.dataLayer = window.dataLayer || [];
      // Google gtag requires an arguments object in the dataLayer queue.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("consent", "default", denied);
      window.gtag("consent", "update", { ...denied, analytics_storage: "granted" });
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: `https://getreplypass.com/${group}`, page_title: group, page_referrer: "" });
      const script = document.createElement("script");
      script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script); initialized = true;
    }
    window.gtag?.("event", "page_view", { send_to: GA_ID, page_location: `https://getreplypass.com/${group}`, page_title: group, page_referrer: "", page_group: group });
  }, [pathname, revision]);
  useEffect(() => { trackMetaPage(pathname); }, [pathname, revision]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a[href="/creators"], a[href="/creator/apply"]');
      if (link) track("creator_cta_click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  function choose(analytics: boolean, marketing: boolean) {
    try {
      const at = Date.now();
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: analytics, at }));
      if (metaPixelConfigured()) localStorage.setItem(MARKETING_CONSENT_KEY, JSON.stringify({ accepted: marketing, at }));
      else localStorage.removeItem(MARKETING_CONSENT_KEY);
    } catch { /* No persistent storage means optional tracking stays disabled. */ }
    setVisible(false);
    const reloadForWithdrawal = (!analytics && initialized) || (!marketing && Boolean(window.fbq));
    if (!analytics && initialized) {
      Object.assign(window, { [`ga-disable-${GA_ID}`]: true });
      window.gtag?.("consent", "update", denied);
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (/^_ga(?:_|$)/.test(name)) for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
      }
    }
    if (!marketing) {
      for (const name of ["_fbp", "_fbc"]) for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
    if (reloadForWithdrawal) location.reload();
    else setRevision(v => v + 1);
  }
  return <>
    <div className="cookie-settings"><button type="button" onClick={() => { setCustomizing(true); setVisible(true); }}>Cookie preferences</button></div>
    {visible && <section className="consent-banner" aria-label="Cookie preferences">
      <div><strong>A little choice about cookies.</strong><p>Essential storage keeps ReplyPass working. With your permission, analytics helps us improve the product{metaPixelConfigured() ? " and Meta advertising helps us measure campaigns" : ""}. You can change your choices anytime. <Link href="/privacy">Privacy details</Link></p></div>
      {customizing && <div className="consent-options">
        <label><span><strong>Analytics</strong><small>Google Analytics product measurement</small></span><input type="checkbox" checked={analyticsChoice} onChange={event => setAnalyticsChoice(event.target.checked)} /></label>
        {metaPixelConfigured() && <label><span><strong>Advertising</strong><small>Meta Pixel campaign and conversion measurement</small></span><input type="checkbox" checked={marketingChoice} onChange={event => setMarketingChoice(event.target.checked)} /></label>}
      </div>}
      {customizing ? <div className="consent-actions"><button type="button" onClick={() => choose(false, false)}>Reject optional</button><button type="button" onClick={() => choose(analyticsChoice, marketingChoice)}>Save choices</button></div> : <>
        <div className="consent-actions"><button type="button" onClick={() => choose(false, false)}>Reject optional</button><button type="button" onClick={() => choose(true, metaPixelConfigured())}>Accept all</button></div>
        <button className="consent-manage" type="button" onClick={() => setCustomizing(true)}>Manage choices</button>
      </>}
    </section>}
  </>;
}
