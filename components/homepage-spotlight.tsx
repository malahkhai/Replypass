"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const stories = [
  {
    image: "/images/home-creator-style.avif",
    alt: "A woman in a black leather jacket standing in a sunlit park",
    headline: "Access is premium.",
    payoff: "Turn it into income.",
    note: "Your pay-link in bio for Guaranteed Replies and VIP memberships. Set your price. Share your link.",
  },
  {
    image: "/images/home-creator-connection.avif",
    alt: "A woman smiling beneath spring blossoms",
    headline: "Your attention has value.",
    payoff: "Make it your business.",
    note: "Give followers a way to pay for a personal reply or join your VIP community. All through one link.",
  },
];

export function HomepageSpotlight() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const story = stories[active];

  useEffect(() => {
    if (paused || hovered || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % stories.length), 7000);
    return () => window.clearInterval(timer);
  }, [hovered, paused]);

  return (
    <div
      className="marketing-showcase homepage-spotlight"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="spotlight-photo">
        <Image
          key={story.image}
          src={story.image}
          alt={story.alt}
          fill
          sizes="(max-width: 760px) 100vw, 44vw"
          priority={active === 0}
        />
        <span className="showcase-label">YOUR PAY-LINK IN BIO</span>
        <div className="spotlight-copy" aria-live="off">
          <h2><em>{story.headline}</em><span>{story.payoff}</span></h2>
          <p>{story.note}</p>
          <div className="spotlight-products">
            <span>Guaranteed Replies</span>
            <span>VIP memberships</span>
          </div>
        </div>
      </div>
      <div className="spotlight-footer">
        <span className="showcase-link">Your link. Your price. Your terms.</span>
        <div className="spotlight-controls" aria-label="Creator stories">
          {stories.map((item, index) => (
            <button
              key={item.image}
              type="button"
              aria-label={`Show story ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            />
          ))}
          <button
            type="button"
            className="spotlight-pause"
            aria-label={paused ? "Play creator stories" : "Pause creator stories"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  );
}
