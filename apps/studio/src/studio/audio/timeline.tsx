// WHAT: The Studio audio system — a shared SFX library + timeline engine +
//       ambient music layer. Every story declares an AudioTimeline of events;
//       the engine turns them into precisely-timed <Audio> elements.
// WHY:  All sounds are synthesized WAVs in public/audio — zero external
//       licensing concerns, fully reproducible exports.

import React from "react";
import { Audio, staticFile } from "remotion";

export const sfx = {
  click: staticFile("audio/click.wav"),
  tap: staticFile("audio/tap.wav"),
  hover: staticFile("audio/hover.wav"),
  notification: staticFile("audio/notification.wav"),
  success: staticFile("audio/success.wav"),
  coin: staticFile("audio/coin.wav"),
  whoosh: staticFile("audio/whoosh.wav"),
  typing: staticFile("audio/typing.wav"),
  confetti: staticFile("audio/confetti.wav"),
} as const;

export type SfxName = keyof typeof sfx;

export const ambientTrack = staticFile("audio/ambient.wav");

export interface AudioEvent {
  frame: number; // composition-absolute frame
  sound: SfxName;
  volume?: number;
}

interface AudioTimelineProps {
  events: AudioEvent[];
  enabled?: boolean;
  masterVolume?: number;
}

// WHAT: Renders every SFX event as a precisely-timed audio clip.
export const AudioTimeline: React.FC<AudioTimelineProps> = ({
  events,
  enabled = true,
  masterVolume = 0.55,
}) => {
  if (!enabled) return null;
  return (
    <>
      {events.map((e, i) => (
        <Audio
          key={i}
          src={sfx[e.sound]}
          startFrom={e.frame}
          endAt={e.frame + 240}
          volume={e.volume ?? masterVolume}
          muted={!enabled}
        />
      ))}
    </>
  );
};

interface AmbientProps {
  enabled?: boolean;
  volume?: number;
}

// WHAT: The subtle generative music bed — supports the story, never dominates.
export const AmbientMusic: React.FC<AmbientProps> = ({ enabled = true, volume = 0.34 }) => {
  if (!enabled) return null;
  return <Audio src={ambientTrack} loop volume={volume} />;
};

// WHAT: Convenience timeline constructor for stories
export const ev = (frame: number, sound: SfxName, volume?: number): AudioEvent => ({
  frame,
  sound,
  volume,
});