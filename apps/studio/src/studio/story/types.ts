// WHAT: The Story system — the contract every Studio story implements.
// WHY:  A story is a self-contained, declarative video: scenes + timing +
//       audio. The engine (StoryComposition) renders it identically at every
//       aspect ratio. New stories only add to the registry — never touch
//       existing stories or shared code beyond additive imports.

import React from "react";
import { AudioEvent } from "../audio/timeline";
import { TransitionStyle } from "../motion/transitions";
import { Ratio } from "../brand/tokens";

export interface SceneProps {
  startFrame: number;
  durationFrames: number;
}

export interface SceneDefinition {
  id: string;
  title: string;
  startFrame: number;
  durationFrames: number;
  transition?: TransitionStyle;
  component: React.FC<SceneProps>;
}

export interface AudioSettings {
  sfx: boolean;
  music: boolean;
}

export interface StoryDefinition {
  id: string;
  title: string;
  description: string;
  fps: number;
  durationFrames: number;
  scenes: SceneDefinition[];
  audioEvents?: AudioEvent[];
  defaultAudio?: AudioSettings;
  defaultRatio?: Ratio;
  /** which ratios to register compositions for (defaults to [defaultRatio]) */
  ratios?: Ratio[];
}

export interface StoryProps {
  audio?: AudioSettings;
  seed?: number;
}

export const frames = (seconds: number, fps = 30) => Math.round(seconds * fps);

export const storyDuration = (seconds: number, fps = 30) => frames(seconds, fps);
