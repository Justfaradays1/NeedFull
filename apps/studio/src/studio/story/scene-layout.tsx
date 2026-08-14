// WHAT: Ratio-aware scene layout — places a phone/browser mockup plus copy
//       for ANY composition (16:9, 9:16, 1:1). PhoneScene also maps
//       device-normalized cursor paths onto the composition, so scenes can
//       animate a cursor over the UI without knowing the final resolution.

import React from "react";
import { useVideoConfig, interpolate, useCurrentFrame, Easing } from "remotion";
import { palette, fonts } from "../brand/tokens";
import { AnimatedCursor, CursorKeyframe, CursorClick } from "../motion/cursor";

// WHAT: Copy (kicker / headline / sub) that staggers in — consistent voice.
export const CopyBlock: React.FC<{
  startFrame: number;
  kicker?: string;
  headline: string;
  sub?: string;
  headlineColor?: string;
  light?: boolean;
  align?: "left" | "center";
}> = ({ startFrame, kicker, headline, sub, headlineColor, light = false, align = "left" }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const k = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const h = interpolate(local - 8, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const s = interpolate(local - 18, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const textColor = light ? "#fff" : palette.text;

  return (
    <div style={{ textAlign: align, maxWidth: 560 }}>
      {kicker && (
        <div
          style={{
            opacity: k,
            transform: `translateY(${(1 - k) * 16}px)`,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: palette.gold,
            fontFamily: fonts.body,
            marginBottom: 18,
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          opacity: h,
          transform: `translateY(${(1 - h) * 26}px)`,
          fontSize: 66,
          fontWeight: 900,
          letterSpacing: -2.5,
          lineHeight: 1.06,
          color: headlineColor ?? textColor,
          fontFamily: fonts.display,
        }}
      >
        {headline}
      </div>
      {sub && (
        <div
          style={{
            opacity: s,
            transform: `translateY(${(1 - s) * 18}px)`,
            marginTop: 22,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.5,
            color: light ? "rgba(255,255,255,0.78)" : palette.textMuted,
            fontFamily: fonts.body,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

export interface DeviceCursor {
  keyframes: CursorKeyframe[]; // normalized to the DEVICE screen 0..1
  clicks?: CursorClick[];      // composition-absolute
  startFrame?: number;
  durationFrames: number;
  size?: number;
  seed?: number;
}

export type DeviceCollocation = "left" | "center";

// WHAT: The scene layout engine — copy + device, positioned per ratio.
export const DeviceScene: React.FC<{
  startFrame: number;
  copy: React.ReactNode;
  children: React.ReactNode; // the screen content rendered inside the device
  deviceWidth?: number;
  deviceHeight?: number;
  cursor?: DeviceCursor;
  bg?: string;
  copyWidth?: string; // e.g. "42%" on wide ratios
}> = ({ startFrame, copy, children, deviceWidth = 390, deviceHeight = 844, cursor, bg = palette.surface, copyWidth = "40%" }) => {
  const { width: W, height: H } = useVideoConfig();
  const ratio = W / H;
  const wide = ratio > 1.2;
  const tall = ratio < 0.62;

  // WHAT: pixels of the device box on screen
  let devW: number, devH: number, x: number, y: number;

  if (wide) {
    // copy left, device right
    const cw = W * 0.44;
    const areaW = W - cw - W * 0.04;
    const areaH = H * 0.94;
    const s = Math.min(areaW / deviceWidth, areaH / deviceHeight);
    devW = deviceWidth * s;
    devH = deviceHeight * s;
    x = cw + (areaW - devW) / 2 + W * 0.02;
    y = (H - devH) / 2;
  } else if (tall) {
    // copy top, device below (device fills most)
    const copyH = Math.min(H * 0.24, 420);
    const areaH = H - copyH - H * 0.05;
    const areaW = W * 0.94;
    const s = Math.min(areaW / deviceWidth, areaH / deviceHeight);
    devW = deviceWidth * s;
    devH = deviceHeight * s;
    x = (W - devW) / 2;
    y = copyH + (areaH - devH) / 2;
  } else {
    // square: copy top compact, device centered below
    const copyH = Math.min(H * 0.24, 300);
    const areaH = H - copyH;
    const areaW = W * 0.96;
    const s = Math.min(areaW / deviceWidth, areaH / deviceHeight);
    devW = deviceWidth * s;
    devH = deviceHeight * s;
    x = (W - devW) / 2;
    y = copyH + (areaH - devH) * 0.45;
  }

  // WHAT: copy container bounds
  const copyBoxW = wide ? W * 0.44 : W;
  const copyBoxH = wide ? H : tall ? Math.min(H * 0.24, 420) : Math.min(H * 0.24, 300);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: bg, overflow: "hidden" }}>
      {/* soft brand glow behind device */}
      <div
        style={{
          position: "absolute",
          left: x + devW / 2 - devW * 0.75,
          top: y - devH * 0.2,
          width: devW * 1.5,
          height: devH * 0.9,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${palette.greenSoft}, transparent)`,
          opacity: 0.9,
        }}
      />

      {/* copy */}
      <div
        style={{
          position: "absolute",
          left: wide ? W * 0.045 : (W - copyBoxW) / 2,
          top: wide ? "50%" : tall ? H * 0.03 : H * 0.015,
          transform: wide ? "translateY(-50%)" : "none",
          width: copyBoxW * (wide ? 1 : 0.88),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: wide ? "none" : "scale(0.82)" }}>{copy}</div>
      </div>

      {/* device */}
      <div style={{ position: "absolute", left: x, top: y, width: devW, height: devH, zIndex: 2 }}>
        <div
          style={{
            transform: `scale(${devW / deviceWidth})`,
            transformOrigin: "top left",
            width: deviceWidth,
            height: deviceHeight,
            position: "absolute",
          }}
        >
          {children}
        </div>
      </div>

      {/* cursor mapped into composition space */}
      {cursor && (
        <AnimatedCursor
          keyframes={cursor.keyframes.map((k) => ({
            t: k.t,
            x: (x + k.x * devW) / W,
            y: (y + k.y * devH) / H,
          }))}
          clicks={cursor.clicks}
          startFrame={cursor.startFrame}
          durationFrames={cursor.durationFrames}
          size={cursor.size}
          seed={cursor.seed}
        />
      )}
    </div>
  );
};

// WHAT: Full-bleed copy scene (no device) — for title cards, CTA etc.
export const CopyScene: React.FC<{
  startFrame: number;
  copy?: React.ReactNode;
  bg?: string;
  children?: React.ReactNode; // ornaments behind copy
}> = ({ startFrame, copy, bg = palette.ink, children }) => {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
      {copy}
    </div>
  );
};