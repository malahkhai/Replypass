"use client";

import { useState, type ReactNode } from "react";
import { creatorUrl } from "@/lib/site";
import { track } from "@/lib/analytics/client";

export function CopyCreatorLink({
  creatorId,
  handle,
  surface,
  children,
  className,
  trackable = true,
}: {
  creatorId: string | null;
  handle: string;
  surface: "creator_dashboard" | "public_profile";
  children: ReactNode;
  className: string;
  trackable?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      const url = creatorUrl(handle);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement("textarea");
        field.value = url;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
      track("creator_link_copied", surface);

      if (trackable && creatorId) {
        void fetch("/api/analytics/creator-link-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId, surface }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2200);
    }
  }

  const label = status === "copied" ? "Link copied" : status === "error" ? "Could not copy" : children;
  return (
    <button
      type="button"
      className={className}
      onClick={copy}
      aria-label={status === "copied" ? "Link copied" : status === "error" ? "Could not copy link" : `Copy ${handle} profile link`}
      title="Copy profile link"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
