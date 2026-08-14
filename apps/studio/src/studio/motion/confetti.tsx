// WHAT: Deterministic confetti burst — used when a review lands / trust grows.

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { mulberry32 } from "./prng";
import { palette } from "../brand/tokens";

export const Confetti: React.FC<{
  startFrame: number;
  count?: number;
  width: number;
  height: number;
  seed?: number;
  durationFrames?: number;
}> = ({ startFrame, count = 90, width, height, seed = 42, durationFrames = 90 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0) return null;

  const rng = mulberry32(seed);
  const colors = [palette.green, palette.gold, palette.greenLight, palette.goldDark, "#3FA97C", "#F4C04D"];

  const pieces = Array.from({ length: count }, (_, i) => {
    const x0 = rng() * width;
    const vx = (rng() - 0.5) * 1.55;
    const fall = 0.55 + rng() * 0.85; // px per frame
    const size = 7 + rng() * 9;
    const rotation = rng() * 360;
    const rotSpeed = (rng() - 0.5) * 14;
    const delay = rng() * 14;
    const flutter = rng() * 2 * Math.PI;
    return { x0, vx, fall, size, rotation, rotSpeed, delay, flutter, color: colors[i % colors.length] };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 40, pointerEvents: "none" }}>
      {pieces.map((p, i) => {
        const t = Math.max(0, local - p.delay);
        const progress = t / durationFrames;
        const drop = interpolate(t, [0, durationFrames], [0, height * 1.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.quad),
        });
        const x = p.x0 + p.vx * t + Math.sin(t * 0.09 + p.flutter) * 18;
        const opacity = interpolate(progress, [0.72, 1], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: -20 + drop,
              width: p.size,
              height: p.size * 0.62,
              backgroundColor: p.color,
              borderRadius: 3,
              transform: `rotate(${p.rotation + p.rotSpeed * t}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};