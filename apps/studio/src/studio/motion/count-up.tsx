// WHAT: Money/stat count-up with a premium ease — used everywhere amounts move.

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export const CountUp: React.FC<{
  startFrame: number;
  to: number;
  from?: number;
  durationFrames?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatNaira?: boolean;
  style?: React.CSSProperties;
}> = ({
  startFrame,
  to,
  from = 0,
  durationFrames = 42,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatNaira = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0) {
    return <span style={style}>{prefix + naira(from, decimals, formatNaira) + suffix}</span>;
  }
  const p = interpolate(local, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const value = from + (to - from) * p;
  return (
    <span style={style}>
      {prefix}
      {naira(value, decimals, formatNaira)}
      {suffix}
    </span>
  );
};

function naira(value: number, decimals: number, formatNaira: boolean): string {
  if (formatNaira) {
    return "₦" + Math.round(value).toLocaleString("en-NG");
  }
  return value.toFixed(decimals);
}

// WHAT: Filled progress ring / bar for trust scores etc.
export const ProgressBar: React.FC<{
  startFrame: number;
  value: number; // 0..100
  width?: number;
  height?: number;
  color?: string;
  trackColor?: string;
}> = ({ startFrame, value, width = 220, height = 10, color = "#1A6B4A", trackColor = "rgba(255,255,255,0.2)" }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const p = interpolate(local, [0, 34], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${p}%`,
          height: "100%",
          borderRadius: height / 2,
          background: color,
        }}
      />
    </div>
  );
};