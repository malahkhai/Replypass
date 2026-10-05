"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const stories = [
  {
    image: "/images/home-creator-style.avif",
    alt: "A woman in a black leather jacket standing in a sunlit park",
    label: "STYLE, STORY, POINT OF VIEW",
    prompt: "“What inspired the look that feels most like you?”",
    note: "A thoughtful question can open a more personal conversation.",
  },
  {
    image: "/images/home-creator-connection.avif",
    alt: "A woman smiling beneath spring blossoms",
    label: "SMALL MOMENTS, CLOSER CONNECTIONS",
    prompt: "“What’s one little thing that always makes your day?”",
    note: "Send a note to someone whose work makes you smile.",
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
        <span className="showcase-label">A LITTLE CLOSER TO YOUR PEOPLE</span>
        <span className="spotlight-index">0{active + 1} / 0{stories.length}</span>
      </div>
      <div className="spotlight-story" aria-live="polite">
        <span className="eyebrow">{story.label}</span>
        <p className="spotlight-prompt">{story.prompt}</p>
        <p className="spotlight-note">{story.note}</p>
        <div className="spotlight-promise">
          <span>Guaranteed reply</span>
          <strong>No reply = no charge.</strong>
        </div>
      </div>
      <div className="spotlight-footer">
        <span className="showcase-link">Start with a creator’s link</span>
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
