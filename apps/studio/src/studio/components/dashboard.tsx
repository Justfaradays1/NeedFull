// WHAT: Desktop dashboard mockup (shown in the browser frame during the
//       "reveal" scene). Designed in a 1280×800 space.

import React from "react";
import { palette, fonts, radii } from "../brand/tokens";
import { tasks, avatarOf, naira } from "../data/fake-data";
import { Logo, Avatar } from "./shell";
import { Stagger } from "../motion/transitions";

const NavItem: React.FC<{ icon: string; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: active ? 800 : 600,
      fontFamily: fonts.body,
      color: active ? palette.green : palette.textMuted,
      backgroundColor: active ? palette.greenSoft : "transparent",
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span> {label}
  </div>
);

export const DesktopDashboard: React.FC<{ startFrame?: number }> = ({ startFrame = 0 }) => {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: palette.surface, position: "relative" }}>
      {/* sidebar */}
      <div
        style={{
          width: 210,
          backgroundColor: palette.card,
          borderRight: `1px solid ${palette.line}`,
          padding: "18px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 8px 14px" }}>
          <Logo size={34} wordSize={18} dark />
        </div>
        <NavItem icon="🏠" label="Home" active />
        <NavItem icon="🔍" label="Find Tasks" />
        <NavItem icon="👛" label="Wallet" />
        <NavItem icon="💬" label="Messages" />
        <NavItem icon="👤" label="Profile" />
        <div style={{ flex: 1 }} />
        <div
          style={{
            backgroundColor: palette.warningSoft,
            borderRadius: 12,
            padding: 10,
            fontSize: 10.5,
            color: palette.goldDark,
            fontFamily: fonts.body,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          💡 You have 3 new applications pending
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, fontFamily: fonts.display, color: palette.text }}>
              Good morning, Tolu 👋
            </div>
            <div style={{ fontSize: 12, color: palette.textMuted, fontFamily: fonts.body, marginTop: 2 }}>
              6 tasks near you · 3 need help with printing
            </div>
          </div>
          <div
            style={{
              backgroundColor: palette.green,
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              fontFamily: fonts.body,
              borderRadius: 999,
              padding: "9px 18px",
            }}
          >
            + Post a Task
          </div>
        </div>

        <div
          style={{
            backgroundColor: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 12.5,
            color: palette.textFaint,
            fontFamily: fonts.body,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🔍 Search tasks, categories, locations…
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, overflow: "hidden" }}>
          <Stagger startFrame={startFrame + 20} gapFrame={8}>
            {tasks.slice(0, 4).map((t) => {
              const poster = avatarOf(t.poster);
              return (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: palette.card,
                    border: `1px solid ${palette.line}`,
                    borderRadius: radii.md,
                    padding: 13,
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: palette.green, backgroundColor: palette.greenSoft, borderRadius: 999, padding: "3px 8px", fontFamily: fonts.body }}>
                      {t.category}
                    </span>
                    {t.urgent && <span style={{ fontSize: 8.5, fontWeight: 800, color: palette.error, backgroundColor: palette.errorSoft, borderRadius: 999, padding: "3px 7px", fontFamily: fonts.body }}>URGENT</span>}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: palette.goldDark, fontFamily: fonts.display }}>{naira(t.budgetNaira)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: palette.text, fontFamily: fonts.body, lineHeight: 1.35 }}>{t.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: palette.textMuted, fontFamily: fonts.body }}>
                    📍 {t.location} · {t.distanceKm}km
                    <div style={{ flex: 1 }} />
                    <Avatar student={poster} size={20} />
                    <span>{poster.name.split(" ")[0]}</span>
                  </div>
                </div>
              );
            })}
          </Stagger>
        </div>
      </div>

      {/* right rail */}
      <div style={{ width: 240, padding: "20px 14px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.green}, ${palette.greenDark})`,
            borderRadius: radii.md,
            padding: 14,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontWeight: 600 }}>WALLET BALANCE</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: fonts.display, marginTop: 3 }}>{naira(4250)}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontFamily: fonts.body, marginTop: 8 }}>🔒 ₦2,300 in escrow</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: palette.text, fontFamily: fonts.display }}>Notifications</div>
        {["Amina applied to your task", "Payment of ₦1,500 released", "New task matched your skills"].map((n, i) => (
          <div
            key={i}
            style={{
              backgroundColor: palette.card,
              border: `1px solid ${palette.line}`,
              borderRadius: 11,
              padding: "9px 11px",
              fontSize: 10.5,
              color: palette.text,
              fontFamily: fonts.body,
              fontWeight: 600,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: i === 1 ? palette.greenSoft : palette.warningSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
              {i === 1 ? "🤑" : i === 2 ? "🔍" : "👋"}
            </span>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};