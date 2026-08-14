// WHAT: The cursor engine — a polished, natural-feeling animated cursor.
// WHY:  Realistic cursor movement is the #1 trick that makes UI footage feel
//       human. Movements are keyframes in normalized (0..1) space, interpolated
//       with easing + a touch of overshoot + subtle noise wobble.

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { palette } from "../brand/tokens";
import { mulberry32 } from "./prng";

export interface CursorKeyframe {
  t: number; // 0..1 progress across the total path duration
  x: number; // normalized 0..1
  y: number;
}

export interface CursorClick {
  frame: number; // frame (composition-absolute) at which the click happens
  duration?: number; // press duration in frames
}

export interface CursorProps {
  keyframes: CursorKeyframe[];
  clicks?: CursorClick[];
  startFrame?: number;
  durationFrames: number; // total frames the cursor stays on screen
  size?: number;
  seed?: number;
  onStart?: boolean; // fade cursor in at startFrame
}

const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

function samplePath(keyframes: CursorKeyframe[], time: number): { x: number; y: number } {
  if (keyframes.length === 0) return { x: 0.5, y: 0.5 };
  if (time <= keyframes[0].t) return { x: keyframes[0].x, y: keyframes[0].y };
  const last = keyframes[keyframes.length - 1];
  if (time >= last.t) return { x: last.x, y: last.y };

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (time >= a.t && time <= b.t) {
      const span = b.t - a.t || 1;
      let p = (time - a.t) / span;
      // overshoot-ish cubic: easeInOut but slightly pinned at the end
      p = easeInOut(p);
      // tiny parabola lift to feel organic on long moves
      const lift = Math.sin(p * Math.PI) * 0.004;
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p - lift,
      };
    }
  }
  return { x: last.x, y: last.y };
}

export const AnimatedCursor: React.FC<CursorProps> = ({
  keyframes,
  clicks = [],
  startFrame = 0,
  durationFrames,
  size = 34,
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > durationFrames) return null;

  const rng = mulberry32(seed);
  const pathTime = Math.max(0.0001, keyframes[keyframes.length - 1]?.t || 1);
  const totalSec = (durationFrames / 30) * pathTime;

  // WHAT: organic wobble — slow perlin-ish drift using layered sines
  const n1 = Math.sin(frame * 0.045 + rng() * 100) * 0.0016;
  const n2 = Math.sin(frame * 0.113 + rng() * 100) * 0.0011;

  const { x, y } = samplePath(keyframes, Math.min(1, local / durationFrames / pathTime));
  const px = (x + n1) * 100;
  const py = (y + n2) * 100;

  // WHAT: which click is active right now
  const activeClick = clicks.find((c) => {
    const cLocal = c.frame - startFrame;
    return cLocal >= 0 && cLocal <= (c.duration ?? 10);
  });
  const clickActive = !!activeClick;

  const pressProgress = activeClick
    ? interpolate(
        frame - activeClick.frame,
        [0, 5, (activeClick.duration ?? 10) - 2, activeClick.duration ?? 10],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;

  // WHAT: cursor fades in quickly after startFrame
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // WHAT: ripple ring expanding out from a click
  const ripple = activeClick
    ? interpolate(frame - activeClick.frame, [0, 26], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeOut,
      })
    : 0;

  const scale = clickActive ? 1 - pressProgress * 0.28 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: `${px}%`,
        top: `${py}%`,
        zIndex: 90,
        pointerEvents: "none",
        opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: "none",
      }}
    >
      {/* pointer */}
      <div
        style={{
          position: "absolute",
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: "50%",
          backgroundColor: palette.white,
          border: `2.5px solid ${palette.greenDark}`,
          boxShadow: "0 2px 10px rgba(12,18,16,0.35)",
        }}
      />
      {clickActive && ripple > 0 && (
        <div
          style={{
            position: "absolute",
            width: size * (0.8 + ripple * 3.4),
            height: size * (0.8 + ripple * 3.4),
            left: -size * (0.8 + ripple * 3.4) / 2 + size * 0.31,
            top: -size * (0.8 + ripple * 3.4) / 2 + size * 0.31,
            borderRadius: "50%",
            border: `2.5px solid ${palette.gold}`,
            opacity: (1 - ripple) * 0.9,
          }}
        />
      )}
    </div>
  );
};