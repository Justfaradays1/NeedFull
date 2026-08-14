// WHAT: Remotion root — registers every story composition from the registry.
//       Render with:
//         npx remotion render <id>-16x9 out/what-is-needfull.mp4

import React from "react";
import { Composition, registerRoot } from "remotion";
import { StoryPlayer } from "./story/StoryComposition";
import { getCompositionRegistrations } from "./story/registry";
import { StoryDefinition, StoryProps } from "./story/types";

const players = new Map<string, React.FC<StoryProps>>();

function playerFor(story: StoryDefinition): React.FC<StoryProps> {
  let c = players.get(story.id);
  if (!c) {
    c = (props: StoryProps) => <StoryPlayer story={story} {...props} />;
    c.displayName = `StoryPlayer_${story.id}`;
    players.set(story.id, c);
  }
  return c;
}

export const RemotionRoot: React.FC = () => {
  const registrations = getCompositionRegistrations();
  return (
    <>
      {registrations.map((reg) => (
        <Composition
          key={reg.id}
          id={reg.id}
          component={playerFor(reg.story)}
          durationInFrames={reg.story.durationFrames}
          fps={reg.story.fps}
          width={reg.width}
          height={reg.height}
          defaultProps={{ audio: { sfx: true, music: true } }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
