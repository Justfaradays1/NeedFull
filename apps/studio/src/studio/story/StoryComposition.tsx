// WHAT: The story engine — turns any StoryDefinition into a rendered
//       composition: scenes at their frame ranges + the audio timeline +
//       the ambient music bed. Stories never render themselves; the engine
//       owns all absolute-frame timing.

import React from "react";
import { useVideoConfig } from "remotion";
import { StoryDefinition, StoryProps } from "./types";
import { SceneTransition } from "../motion/transitions";
import { AudioTimeline, AmbientMusic } from "../audio/timeline";

export const StoryPlayer: React.FC<{ story: StoryDefinition } & StoryProps> = ({
  story,
  audio,
}) => {
  const settings = { sfx: true, music: true, ...story.defaultAudio, ...audio };
  const { fps } = useVideoConfig();

  return (
    <>
      <AudioTimeline events={story.audioEvents ?? []} enabled={settings.sfx} />
      <AmbientMusic enabled={settings.music} />
      {story.scenes.map((scene) => (
        <SceneTransition
          key={scene.id}
          startFrame={scene.startFrame}
          durationFrames={scene.durationFrames}
          style={scene.transition ?? "fade"}
        >
          <scene.component
            startFrame={scene.startFrame}
            durationFrames={scene.durationFrames}
          />
        </SceneTransition>
      ))}
    </>
  );
};
