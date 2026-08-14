// WHAT: Scene transition primitives — cinematic fades, slides, zooms.
// WHY:  A consistent motion language across every story.

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { palette } from "../brand/tokens";

export type TransitionStyle = "fade" | "slide-up" | "zoom" | "wipe-left" | "flash";

const eased = (t: number) => Easing.inOut(Easing.cubic)(t);

// WHAT: Wraps a scene — fades/slides content in at its startFrame and out at
//       its end. All scenes share this single motion contract.
export const SceneTransition: React.FC<{
  startFrame: number;
  durationFrames: number;
  style?: TransitionStyle;
  children: React.ReactNode;
  // how many frames of overlap before the scene end fade starts
  outLead?: number;
}> = ({ startFrame, durationFrames, style = "fade", children, outLead = 14 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const total = durationFrames;
  if (local < 0 || local > total) return null;

  const fadeIn = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: eased,
  });
  const fadeOut = interpolate(local, [total - outLead, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: eased,
  });

  let x = 0;
  let y = 0;
  let scale = 1;
  switch (style) {
    case "slide-up":
      y = (1 - fadeIn) * 60;
      break;
    case "zoom":
      scale = 0.94 + 0.06 * fadeIn;
      break;
    case "wipe-left":
      x = (1 - fadeIn) * 90;
      break;
    default:
      break;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: Math.min(fadeIn, fadeOut),
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};

// WHAT: A full-screen color flash used on hard cuts (logo reveal, CTA)
export const Flash: React.FC<{
  startFrame: number;
  durationFrames?: number;
  color?: string;
  maxOpacity?: number;
}> = ({ startFrame, durationFrames = 22, color = palette.ink, maxOpacity = 0.85 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, 8, durationFrames - 4, durationFrames], [0, maxOpacity, maxOpacity, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: color,
        opacity,
        zIndex: 60,
      }}
    />
  );
};

// WHAT: Gentle floating loop for hero ornaments (parallax feel)
export const FloatLoop: React.FC<{
  children: React.ReactNode;
  amplitude?: number;
  frames?: number;
  delay?: number;
}> = ({ children, amplitude = 10, frames = 90, delay = 0 }) => {
  const frame = useCurrentFrame();
  const y = amplitude * Math.sin(((frame + delay) / frames) * Math.PI * 2);
  return <div style={{ transform: `translateY(${y}px)` }}>{children}</div>;
};

// WHAT: Staggered reveal for lists of items
export const Stagger: React.FC<{
  children: React.ReactNode[];
  startFrame: number;
  gapFrame?: number;
  direction?: "up" | "left";
}> = ({ children, startFrame, gapFrame = 7, direction = "up" }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {children.map((child, i) => {
        const local = frame - startFrame - i * gapFrame;
        const p = interpolate(local, [0, 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: eased,
        });
        const offset = direction === "up" ? 34 : 44;
        return (
          <div
            key={i}
            style={{
              opacity: p,
              transform: `translate3d(${direction === "left" ? offset * (1 - p) : 0}px, ${
                direction === "up" ? offset * (1 - p) : 0
              }px, 0)`,
            }}
          >
            {child}
          </div>
        );
      })}
    </>
  );
};

// WHAT: Pop-in with overshoot (buttons, toasts, badges)
export const PopIn: React.FC<{
  startFrame: number;
  children: React.ReactNode;
  scaleTo?: number;
}> = ({ startFrame, children, scaleTo = 1 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const s = spring({
    frame: local,
    fps: 30,
    config: { damping: 12, stiffness: 160, mass: 0.7 },
  });
  if (local < 0) return null;
  return (
    <div style={{ opacity: local > 6 ? 1 : spring({ frame: local, fps: 30 }), transform: `scale(${scaleTo * (0.6 + 0.4 * s)})` }}>
      {children}
    </div>
  );
};