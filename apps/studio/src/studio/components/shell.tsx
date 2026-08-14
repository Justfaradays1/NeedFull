// WHAT: Shared UI shells — logo, phone/browser frames, avatars, and the
//       scaling helper that makes every screen render crisply at ANY ratio.

import React from "react";
import { useVideoConfig } from "remotion";
import { palette, fonts, shadows } from "../brand/tokens";
import { avatarOf, Student } from "../data/fake-data";

// WHAT: NeedFull mark + wordmark
export const Logo: React.FC<{ size?: number; dark?: boolean; withWord?: boolean; wordSize?: number }> = ({
  size = 44,
  dark = false,
  withWord = true,
  wordSize = 26,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          background: `linear-gradient(135deg, ${palette.green}, ${palette.greenDark})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: shadows.card,
          position: "relative",
        }}
      >
        <div style={{ color: "#fff", fontWeight: 800, fontSize: size * 0.5, letterSpacing: -0.5, fontFamily: fonts.display }}>
          NF
        </div>
        <div
          style={{
            position: "absolute",
            right: size * 0.12,
            top: size * 0.12,
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: "50%",
            backgroundColor: palette.gold,
          }}
        />
      </div>
      {withWord && (
        <span
          style={{
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: wordSize,
            letterSpacing: -0.6,
            color: dark ? palette.ink : "#fff",
          }}
        >
          NeedFull
        </span>
      )}
    </div>
  );
};

// WHAT: Circular avatar with deterministic gradient + initials
export const Avatar: React.FC<{ student: Student; size?: number; ring?: boolean }> = ({
  student,
  size = 40,
  ring = false,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: student.hue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: fonts.body,
        border: ring ? `2.5px solid ${palette.white}` : "none",
        flexShrink: 0,
      }}
    >
      {student.initials}
    </div>
  );
};

// WHAT: Scales a design-space (e.g. 390×844) to fit the current composition
export const UiScale: React.FC<{
  baseWidth: number;
  baseHeight: number;
  scale?: number; // extra factor
  children: React.ReactNode;
  maxScale?: number;
}> = ({ baseWidth, baseHeight, scale = 1, children, maxScale = 2.6 }) => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width / baseWidth, height / baseHeight, maxScale) * scale;
  return (
    <div style={{ width: baseWidth * s, height: baseHeight * s, position: "relative", overflow: "hidden" }}>
      <div style={{ transform: `scale(${s})`, transformOrigin: "top left", width: baseWidth, height: baseHeight, position: "absolute" }}>
        {children}
      </div>
    </div>
  );
};

// WHAT: A phone device frame (notch + bezel) hosting an app screen
export const PhoneFrame: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
  children,
  width = 390,
  height = 844,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 56,
        backgroundColor: palette.ink,
        padding: 12,
        boxShadow: shadows.lifted,
        position: "relative",
      }}
    >
      {/* notch */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 26,
          borderRadius: 14,
          backgroundColor: palette.ink,
          zIndex: 5,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 46,
          overflow: "hidden",
          backgroundColor: palette.surface,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// WHAT: A desktop browser frame hosting a dashboard
export const BrowserFrame: React.FC<{ children: React.ReactNode; width?: number; height?: number; url?: string }> = ({
  children,
  width = 1280,
  height = 800,
  url = "needfull.app",
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        backgroundColor: palette.card,
        overflow: "hidden",
        boxShadow: shadows.lifted,
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${palette.lineStrong}`,
      }}
    >
      <div
        style={{
          height: 46,
          backgroundColor: palette.surfaceAlt,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {["#E9685F", "#E9B85F", "#6BC26B"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            margin: "0 10px",
            height: 28,
            borderRadius: 8,
            backgroundColor: palette.card,
            border: `1px solid ${palette.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12.5,
            color: palette.textMuted,
            fontFamily: fonts.body,
          }}
        >
          🔒 {url}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
};

// WHAT: Standard app header used across phone screens
export const AppHeader: React.FC<{ title?: string; right?: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  right,
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: palette.green,
        padding: "46px 18px 16px",
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children ?? (
        <>
          <Logo size={34} wordSize={19} />
          {right ?? (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: 999,
                padding: "7px 13px",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: fonts.body,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11 }}>👛</span> ₦4,250
            </div>
          )}
        </>
      )}
      {title && (
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, fontFamily: fonts.display }}>{title}</div>
      )}
    </div>
  );
};