export const HERO_SCENES = ["profile", "request", "reply", "vip"] as const;
export type HeroScene = typeof HERO_SCENES[number];
export const HERO_SCENE_MS = 3000;
export type HeroCreator = {
  name: string; handle: string; kind: string; photo: string; photoPosition?: string;
  bio: string; messagePriceCents: number | null; vipPriceCents: number | null;
  fanQuestion: string; creatorReply: string; illustrative?: boolean;
};
export type HeroFrame = { creator: number; scene: HeroScene };
export function scenesFor(creator: HeroCreator): readonly HeroScene[] {
  return creator.vipPriceCents === null ? HERO_SCENES.slice(0, 3) : HERO_SCENES;
}
export function nextHeroFrame(frame: HeroFrame, creators: HeroCreator[]): HeroFrame {
  if (!creators.length) return frame;
  const scenes = scenesFor(creators[frame.creator]);
  const next = scenes.indexOf(frame.scene) + 1;
  return next < scenes.length ? { ...frame, scene: scenes[next] } : { creator: (frame.creator + 1) % creators.length, scene: "profile" };
}
export function canPlayHero(state: { ready: boolean; visible: boolean; inView: boolean; reduced: boolean; paused: boolean; interacting: boolean }) {
  return state.ready && state.visible && state.inView && !state.reduced && !state.paused && !state.interacting;
}
