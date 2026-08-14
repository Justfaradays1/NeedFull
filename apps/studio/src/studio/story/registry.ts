// WHAT: The story registry — every Studio story + the compositions it
//       generates (one per aspect ratio). To add a story: create a folder in
//       stories/, import its definition here. Nothing else changes.

import { StoryDefinition } from "./types";
import { Ratio, ratioSize } from "../brand/tokens";
import { stories as whatIsNeedFullStories } from "../stories/what-is-needfull";

export const ratioSlug: Record<Ratio, string> = {
  "16:9": "16x9",
  "9:16": "9x16",
  "1:1": "square",
};

export const compositions: StoryDefinition[] = [
  // Flagship explainer — see stories/what-is-needfull/
  ...whatIsNeedFullStories,
];

export interface CompositionRegistration {
  id: string;
  story: StoryDefinition;
  ratio: Ratio;
  width: number;
  height: number;
}

export function getCompositionRegistrations(): CompositionRegistration[] {
  const regs: CompositionRegistration[] = [];
  for (const story of compositions) {
    const ratios: Ratio[] = story.ratios ?? [story.defaultRatio ?? "16:9"];
    for (const ratio of ratios) {
      const size = ratioSize[ratio];
      regs.push({
        id: `${story.id}-${ratioSlug[ratio]}`,
        story,
        ratio,
        width: size.width,
        height: size.height,
      });
    }
  }
  return regs;
}
