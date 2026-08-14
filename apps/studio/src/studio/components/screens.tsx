// WHAT: Chat, wallet, rating, notifications, and marketplace-crowd screens.

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { palette, fonts, radii, shadows } from "../brand/tokens";
import {
  chatThread,
  walletActivity,
  notifications,
  reviews,
  tasks,
  students,
  avatarOf,
  naira,
} from "../data/fake-data";
import { Avatar, AppHeader } from "./shell";
import { MessageBubble, TypingDots } from "../motion/notifications";
import { CountUp, ProgressBar } from "../motion/count-up";
import { Stagger, PopIn } from "../motion/transitions";

// WHAT: Chat screen — bubbles, typing, quick replies, read receipts
export const ChatScreen: React.FC<{ startFrame?: number; quickReplies?: boolean }> = ({
  startFrame = 0,
  quickReplies = true,
}) => {
  const frame = useCurrentFrame();
  const them = avatarOf("Amina Bello");
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader right={undefined}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Avatar student={them} size={32} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, fontFamily: fonts.body }}>Amina Bello</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#5BE08B",
                  display: "inline-block",
                }}
              />
              Online · Runner
            </div>
          </div>
        </div>
      </AppHeader>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 9, flex: 1, overflow: "hidden" }}>
        {chatThread.slice(0, 3).map((m, i) => (
          <MessageBubble key={m.id} startFrame={startFrame + 12 + i * 22} mine={m.from === "me"} maxWidth={236}>
            {m.text}
          </MessageBubble>
        ))}

        {/* typing indicator incoming */}
        <div style={{ alignSelf: "flex-start" }}>
          <MessageBubble startFrame={startFrame + 88} maxWidth={120}>
            <TypingDots startFrame={startFrame + 88} />
          </MessageBubble>
        </div>

        <MessageBubble startFrame={startFrame + 104} mine maxWidth={236}>
          {chatThread[4].text}
          <span style={{ fontSize: 9.5, marginLeft: 6, opacity: 0.7 }}>✓✓</span>
        </MessageBubble>

        <div style={{ flex: 1 }} />

        {quickReplies && frame > startFrame + 130 && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["See you at the gate 👍", "On my way now", "Thanks so much!"].map((q, i) => (
              <span
                key={q}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: fonts.body,
                  color: palette.green,
                  backgroundColor: palette.card,
                  border: `1.5px solid ${palette.green}55`,
                  borderRadius: 999,
                  padding: "6px 11px",
                  opacity: interpolate(frame, [startFrame + 132 + i * 8, startFrame + 140 + i * 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {q}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: 999,
            padding: "9px 6px 9px 14px",
          }}
        >
          <span style={{ fontSize: 12, color: palette.textFaint, fontFamily: fonts.body, flex: 1 }}>Message…</span>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: palette.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
            }}
          >
            ➤
          </span>
        </div>
        <div style={{ height: 18 }} />
      </div>
    </div>
  );
};

// WHAT: Wallet screen — balance count-up + activity feed
export const WalletScreen: React.FC<{ startFrame?: number; creditAmount?: number | null }> = ({
  startFrame = 0,
  creditAmount = 1500,
}) => {
  const reminder = creditAmount ?? 0;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader title="Wallet" />
      <div style={{ padding: "0 16px", marginTop: -26, position: "relative", zIndex: 2 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.green}, ${palette.greenDark})`,
            borderRadius: radii.lg,
            padding: "18px 18px",
            boxShadow: shadows.lifted,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontWeight: 600 }}>
            AVAILABLE BALANCE
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, fontFamily: fonts.display, letterSpacing: -1, marginTop: 2 }}>
            <CountUp startFrame={startFrame + 10} to={4250 + reminder} durationFrames={52} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 10, fontFamily: fonts.body, color: "rgba(255,255,255,0.8)" }}>
            <span>🔒 Escrow: ₦2,300</span>
            <span>⭐ Trust 87</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: palette.text, fontFamily: fonts.display }}>
          Activity
        </div>
        <Stagger startFrame={startFrame + 26} gapFrame={7}>
          {walletActivity.map((w) => (
            <div
              key={w.id}
              style={{
                backgroundColor: w.highlight ? palette.greenSoft : palette.card,
                border: `1px solid ${w.highlight ? palette.green + "66" : palette.line}`,
                borderRadius: radii.sm,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: w.direction === "in" ? palette.greenSoft : palette.warningSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                {w.direction === "in" ? "🤑" : "🔒"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5, color: palette.text, fontFamily: fonts.body }}>{w.label}</div>
                <div style={{ fontSize: 9.5, color: palette.textFaint, fontFamily: fonts.body }}>{w.time}</div>
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: fonts.display,
                  color: w.direction === "in" ? palette.success : palette.textMuted,
                }}
              >
                {w.direction === "in" ? "+" : "−"}
                {naira(w.amountNaira)}
              </span>
            </div>
          ))}
        </Stagger>
        <div style={{ flex: 1 }} />
        <div style={{ height: 18 }} />
      </div>
    </div>
  );
};

// WHAT: Rating screen — stars fill, review text, trust score, submit
export const RatingScreen: React.FC<{ startFrame?: number; stars?: number; trust?: number; confetti?: boolean }> = ({
  startFrame = 0,
  stars = 5,
  trust = 95,
  confetti = true,
}) => {
  const frame = useCurrentFrame();
  const them = avatarOf(reviews[0].from);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface, alignItems: "center", justifyContent: "center", padding: "0 30px", position: "relative" }}>
      <Stagger startFrame={startFrame} gapFrame={6}>
        <Avatar student={them} size={64} />
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 17, fontFamily: fonts.display, color: palette.text, marginTop: 4 }}>
          Rate Amina Bello
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: palette.textMuted, fontFamily: fonts.body }}>
          How was your task experience?
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const local = frame - startFrame - 16 - i * 6;
            const p = interpolate(local, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2)),
            });
            const filled = i < stars;
            return (
              <span
                key={i}
                style={{
                  fontSize: 34,
                  transform: `scale(${0.3 + 0.7 * p}) rotate(${(1 - p) * -24}deg)`,
                  opacity: Math.min(1, p),
                  filter: filled ? "none" : "grayscale(1) opacity(0.35)",
                }}
              >
                ★
              </span>
            );
          })}
        </div>

        <div
          style={{
            backgroundColor: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: radii.md,
            padding: "13px 15px",
            marginTop: 12,
            fontSize: 12.5,
            color: palette.text,
            fontFamily: fonts.body,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          “{reviews[0].text}”
        </div>

        <div
          style={{
            marginTop: 12,
            backgroundColor: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: radii.md,
            padding: "11px 15px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, fontFamily: fonts.body }}>
              Trust Score
            </span>
            <span style={{ fontWeight: 800, fontSize: 16, color: palette.green, fontFamily: fonts.display }}>
              <CountUp startFrame={startFrame + 54} to={trust} durationFrames={46} formatNaira={false} />
            </span>
          </div>
          <div style={{ marginTop: 6 }}>
            <ProgressBar startFrame={startFrame + 56} value={trust} width={210} height={8} />
          </div>
        </div>

        <div style={{ marginTop: 13, width: "100%" }}>
          <PopIn startFrame={startFrame + 74}>
            <div
              style={{
                backgroundColor: palette.green,
                borderRadius: radii.sm,
                padding: "13px",
                textAlign: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                fontFamily: fonts.body,
              }}
            >
              ✓ Review Submitted
            </div>
          </PopIn>
        </div>
      </Stagger>
    </div>
  );
};

// WHAT: Notifications screen — the marketplace talking
export const NotificationsScreen: React.FC<{ startFrame?: number }> = ({ startFrame = 0 }) => {
  const icons: Record<string, string> = {
    task: "📋",
    payment: "🤑",
    chat: "💬",
    rating: "⭐",
  };
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader title="Notifications" />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>
        <Stagger startFrame={startFrame} gapFrame={7}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                backgroundColor: palette.card,
                border: `1px solid ${palette.line}`,
                borderRadius: radii.md,
                padding: "11px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  backgroundColor: n.kind === "payment" ? palette.greenSoft : palette.warningSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {icons[n.kind]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: palette.text, fontFamily: fonts.body }}>{n.title}</div>
                <div style={{ fontSize: 10.5, color: palette.textMuted, fontFamily: fonts.body }}>{n.body}</div>
              </div>
              <span style={{ fontSize: 9, color: palette.textFaint, fontFamily: fonts.body }}>{n.time}</span>
            </div>
          ))}
        </Stagger>
        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
};

// WHAT: Marketplace "alive" mosaic — tasks, reviews, wallets, people
export const MarketplaceGrid: React.FC<{ startFrame?: number; cols?: number }> = ({ startFrame = 0, cols = 2 }) => {
  const grid = [
    ...tasks.slice(0, 4).map((t, i) => (
      <div
        key={t.id}
        style={{
          backgroundColor: palette.card,
          border: `1px solid ${palette.line}`,
          borderRadius: radii.md,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: palette.green, backgroundColor: palette.greenSoft, borderRadius: 999, padding: "3px 8px", fontFamily: fonts.body }}>
            {t.category}
          </span>
          <span style={{ fontWeight: 800, fontSize: 12, color: palette.goldDark, fontFamily: fonts.display }}>{naira(t.budgetNaira)}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.text, fontFamily: fonts.body, lineHeight: 1.35 }}>{t.title}</div>
        <div style={{ fontSize: 9.5, color: palette.textFaint, fontFamily: fonts.body }}>{t.urgent ? "⚡ completed" : "paid & rated"}</div>
      </div>
    )),
    ...reviews.slice(0, 2).map((r) => (
      <div
        key={r.id}
        style={{
          backgroundColor: palette.inkCard,
          borderRadius: radii.md,
          padding: 12,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar student={avatarOf(r.from)} size={22} />
          <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: fonts.body }}>{r.from.split(" ")[0]}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: palette.gold }}>{"★".repeat(r.stars)}</span>
        </div>
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", fontFamily: fonts.body, lineHeight: 1.4 }}>“{r.text}”</div>
      </div>
    )),
    <div
      key="avatars"
      style={{
        backgroundColor: palette.warningSoft,
        borderRadius: radii.md,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: palette.goldDark, fontFamily: fonts.body }}>
        +12 students joined today
      </div>
      <div style={{ display: "flex" }}>
        {students.slice(0, 6).map((s) => (
          <div key={s.id} style={{ marginLeft: -8, border: `2px solid ${palette.warningSoft}` }}>
            <Avatar student={s} size={30} />
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: palette.surface, padding: 20, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, alignContent: "start" }}>
      <Stagger startFrame={startFrame} gapFrame={8}>
        {grid.map((g) => g)}
      </Stagger>
    </div>
  );
};