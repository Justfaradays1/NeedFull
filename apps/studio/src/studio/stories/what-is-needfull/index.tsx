// WHAT: "What is NeedFull?" — the flagship explainer story.
//       Timeline: 9 scenes · 76s @ 30fps · 2280 frames.
//       Scene framing is fixed here; scene visuals live in scenes.tsx.

import { StoryDefinition } from "../../story/types";
import { ev } from "../../audio/timeline";
import {
  CampusPausesScene,
  MeetNeedFullScene,
  PostTaskScene,
  RunnerScene,
  ChatScene,
  EscrowReleaseScene,
  RatingScene,
  MarketplaceScene,
  CTAScene,
} from "./scenes";

const FPS = 30;
const s = (n: number) => Math.round(n * FPS);

const scenes: StoryDefinition["scenes"] = [
  {
    id: "campus-pauses",
    title: "The Problem",
    startFrame: s(0),
    durationFrames: s(10),
    component: CampusPausesScene,
  },
  {
    id: "meet-needfull",
    title: "Reveal",
    startFrame: s(10),
    durationFrames: s(7),
    transition: "flash",
    component: MeetNeedFullScene,
  },
  {
    id: "post-a-task",
    title: "Post a Task",
    startFrame: s(17),
    durationFrames: s(13),
    transition: "fade",
    component: PostTaskScene,
  },
  {
    id: "runner-discovers",
    title: "Runner Discovers",
    startFrame: s(30),
    durationFrames: s(12),
    transition: "fade",
    component: RunnerScene,
  },
  {
    id: "chat",
    title: "Live Chat",
    startFrame: s(42),
    durationFrames: s(8),
    transition: "fade",
    component: ChatScene,
  },
  {
    id: "escrow-release",
    title: "Escrow Release",
    startFrame: s(50),
    durationFrames: s(9),
    transition: "fade",
    component: EscrowReleaseScene,
  },
  {
    id: "rating",
    title: "Rating & Trust",
    startFrame: s(59),
    durationFrames: s(8),
    transition: "fade",
    component: RatingScene,
  },
  {
    id: "marketplace",
    title: "The Marketplace",
    startFrame: s(67),
    durationFrames: s(5),
    transition: "fade",
    component: MarketplaceScene,
  },
  {
    id: "cta",
    title: "Call to Action",
    startFrame: s(72),
    durationFrames: s(4),
    transition: "flash",
    component: CTAScene,
  },
];

const audioEvents = [
  // scene 1 → 2
  ev(s(10), "whoosh"),
  // scene 3: cursor clicks + publish success
  ev(s(17) + 55, "click"),
  ev(s(17) + 155, "click"),
  ev(s(17) + 235, "click"),
  ev(s(17) + 295, "click"),
  ev(s(17) + 330, "success"),
  // scene 4: notification, taps, apply, accept
  ev(s(30) + 15, "notification"),
  ev(s(30) + 85, "click"),
  ev(s(30) + 250, "click"),
  ev(s(30) + 270, "success"),
  // scene 5: typing + quick reply tap
  ev(s(42) + 40, "typing"),
  ev(s(42) + 150, "click"),
  // scene 6: release banner + coin count-up
  ev(s(50) + 60, "success"),
  ev(s(50) + 95, "coin"),
  // scene 7: stars + confetti + submit
  ev(s(59) + 50, "click", 0.4),
  ev(s(59) + 58, "click", 0.4),
  ev(s(59) + 66, "click", 0.4),
  ev(s(59) + 130, "confetti"),
  ev(s(59) + 140, "success"),
  // scene 9
  ev(s(72), "whoosh"),
];

export const stories: StoryDefinition[] = [
  {
    id: "what-is-needfull",
    title: "What is NeedFull?",
    description:
      "The flagship explainer: campus chaos → the product → the full escrow journey → the marketplace → CTA. 76 seconds.",
    fps: FPS,
    durationFrames: s(76),
    scenes,
    audioEvents,
    defaultAudio: { sfx: true, music: true },
    defaultRatio: "16:9",
    ratios: ["16:9", "9:16", "1:1"],
  },
];
