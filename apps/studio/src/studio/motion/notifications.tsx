// WHAT: Typing indicator dots + animated message bubbles.

import React from "react";
import { useCurrentFrame, spring, interpolate, Easing } from "remotion";
import { palette } from "../brand/tokens";

export const TypingDots: React.FC<{ startFrame?: number; dotColor?: string }> = ({
  startFrame = 0,
  dotColor = palette.green,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => {
        const s = spring({
          frame: local - i * 4,
          fps: 30,
          config: { damping: 11, stiffness: 220 },
        });
        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: dotColor,
              transform: `scale(${0.55 + 0.55 * s})`,
              opacity: 0.35 + 0.65 * s,
            }}
          />
        );
      })}
    </div>
  );
};

// WHAT: Incoming message bubble sliding in with a slight scale
export const MessageBubble: React.FC<{
  startFrame: number;
  children: React.ReactNode;
  mine?: boolean;
  maxWidth?: number;
}> = ({ startFrame, children, mine = false, maxWidth = 240 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const p = interpolate(local, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.6)),
  });
  if (local < 0) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px) scale(${0.9 + 0.1 * p})`,
      }}
    >
      <div
        style={{
          maxWidth,
          padding: "10px 14px",
          borderRadius: 16,
          borderBottomRightRadius: mine ? 4 : 16,
          borderBottomLeftRadius: mine ? 16 : 4,
          backgroundColor: mine ? palette.green : palette.cardAlt,
          border: mine ? "none" : `1px solid ${palette.line}`,
          color: mine ? palette.white : palette.text,
          fontSize: 14,
          lineHeight: 1.45,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// WHAT: A single notification toast popping in from the top
export const NotificationToast: React.FC<{
  startFrame: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: string;
}> = ({ startFrame, icon, title, body, accent = palette.green }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const enter = spring({ frame: local, fps: 30, config: { damping: 13, stiffness: 180 } });
  if (local < 0) return null;
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * -26}px) scale(${0.9 + 0.1 * enter})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: palette.inkCard,
          border: `1px solid rgba(255,255,255,0.12)`,
          borderRadius: 18,
          padding: "12px 16px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
          minWidth: 300,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }}>{title}</div>
          <div style={{ color: "rgba(255,255,255,0.66)", fontSize: 12 }}>{body}</div>
        </div>
      </div>
    </div>
  );
};