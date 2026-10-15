"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { analyticsHostAllowed, readChoice, X_CONSENT_KEY } from "@/lib/analytics/model";

export function XPixel() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try {
        setAllowed(
          analyticsHostAllowed(location.hostname) &&
          readChoice(localStorage.getItem(X_CONSENT_KEY)) === true,
        );
      } catch {
        setAllowed(false);
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("replypass:x-consent-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("replypass:x-consent-changed", refresh);
    };
  }, []);

  if (!allowed) return null;
  return (
    <Script id="x-conversion-tracking" strategy="afterInteractive">
      {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('config','rha5c');`}
    </Script>
  );
}
