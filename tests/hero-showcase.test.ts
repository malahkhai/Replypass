import assert from "node:assert/strict";
import test from "node:test";
import { canPlayHero, HERO_SCENE_MS, nextHeroFrame, scenesFor, type HeroCreator, type HeroFrame } from "../lib/marketing/hero-showcase.ts";
import { splitPayment } from "../lib/payments/fees.ts";

const creator: HeroCreator = { name: "Nico", handle: "nico", kind: "DJ", photo: "/images/demo-dj.webp", bio: "Music", messagePriceCents: 2000, vipPriceCents: 1500, fanQuestion: "How do you build a set?", creatorReply: "Read the room.", illustrative: true };
const ready = { ready: true, visible: true, inView: true, reduced: false, paused: false, interacting: false };

test("the first five seconds show a profile and a priced fan request", () => {
  const initial: HeroFrame = { creator: 0, scene: "profile" };
  assert.equal(HERO_SCENE_MS, 3000);
  assert.ok(HERO_SCENE_MS < 5000);
  assert.deepEqual(nextHeroFrame(initial, [creator]), { creator: 0, scene: "request" });
});
test("one creator stays through the full story before the next creator begins", () => {
  const creators = [creator, { ...creator, handle: "luna" }];
  let frame: HeroFrame = { creator: 0, scene: "profile" };
  const sequence = [frame];
  for (let i = 0; i < 8; i++) { frame = nextHeroFrame(frame, creators); sequence.push(frame); }
  assert.deepEqual(sequence.map(f => `${f.creator}:${f.scene}`), ["0:profile", "0:request", "0:reply", "0:vip", "1:profile", "1:request", "1:reply", "1:vip", "0:profile"]);
});
test("creators without VIP never show or charge an invented membership", () => {
  const noVip = { ...creator, vipPriceCents: null };
  assert.deepEqual(scenesFor(noVip), ["profile", "request", "reply"]);
  assert.deepEqual(nextHeroFrame({ creator: 0, scene: "reply" }, [noVip, creator]), { creator: 1, scene: "profile" });
});
test("illustrative earnings use the configured payment split", () => {
  assert.equal(splitPayment(creator.messagePriceCents!).creatorCents, 1700);
  assert.equal(splitPayment(1800).creatorCents, 1530);
});
test("autoplay requires hydration, visibility and viewport intersection", () => {
  assert.equal(canPlayHero(ready), true);
  for (const key of ["ready", "visible", "inView"]) assert.equal(canPlayHero({ ...ready, [key]: false }), false, key);
});
test("reduced motion cannot be overridden by pressing play", () => {
  assert.equal(canPlayHero({ ...ready, reduced: true, paused: false }), false);
  assert.equal(canPlayHero({ ...ready, reduced: true, paused: true }), false);
});
test("pointer/focus interaction and the pause button suspend the timeline", () => {
  assert.equal(canPlayHero({ ...ready, interacting: true }), false);
  assert.equal(canPlayHero({ ...ready, paused: true }), false);
  assert.equal(canPlayHero({ ...ready, interacting: false, paused: false }), true);
});
