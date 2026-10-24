"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { track } from "@/lib/analytics/client";

export function CreatorLinkStarter({ creatorAuthenticated, layout = "inline" }: { creatorAuthenticated: boolean; layout?: "inline" | "stacked" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const normalized = username.trim().toLowerCase();

  function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalized && !/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setError("Use 3–30 letters, numbers or underscores.");
      return;
    }
    const next = `/creator/apply${normalized ? `?username=${normalized}` : ""}`;
    track("creator_cta_click", "creator");
    router.push(creatorAuthenticated ? next : `/signup?next=${encodeURIComponent(next)}`);
  }

  const field = <>
        <span>getreplypass.com/</span>
        <input
          id="creator-link-name"
          aria-label="Your ReplyPass link could look like this"
          value={username}
          onChange={(event) => { setUsername(event.target.value.toLowerCase().replace(/^@/, "")); setError(""); }}
          placeholder="yourname"
          maxLength={30}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="creator-link-hint"
        />
  </>;

  return (
    <form className={`creator-link-starter creator-link-starter-${layout}`} onSubmit={start}>
      <label htmlFor="creator-link-name">Your ReplyPass link could look like this</label>
      <div className="creator-link-starter-row">
        {layout === "stacked" ? <label className="creator-link-starter-field" htmlFor="creator-link-name">{field}</label> : field}
        <button type="submit">{layout === "stacked" ? "Create your page" : "Create my page"} <Icon name="arrow" size={16} /></button>
      </div>
      <small id="creator-link-hint" role="status">{error || (layout === "stacked" ? "" : "You’ll confirm your username during setup. No card needed to create a page.")}</small>
    </form>
  );
}
