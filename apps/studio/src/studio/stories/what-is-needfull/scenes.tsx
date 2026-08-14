// WHAT: The flagship story — "What is NeedFull?" (9 scenes, ~76s).
//       A Seeker's problem → the product → the full escrow journey →
//       marketplace → CTA. All scenes use DeviceScene/CopyScene so the
//       same story renders beautifully at 16:9, 9:16 and 1:1.

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { palette, fonts } from "../../brand/tokens";
import { SceneProps } from "../../story/types";
import { DeviceScene, CopyScene, CopyBlock } from "../../story/scene-layout";
import { Flash, PopIn, Stagger } from "../../motion/transitions";
import { NotificationToast } from "../../motion/notifications";
import { Confetti } from "../../motion/confetti";
import { PhoneFrame } from "../../components/shell";
import {
  FeedScreen,
  PostTaskScreen,
  PostStage,
  TaskDetailScreen,
} from "../../components/task-screens";
import { ChatScreen, WalletScreen, RatingScreen, MarketplaceGrid } from "../../components/screens";

/* ─────────────────────────── Scene 1: The Problem ─────────────────────────── */

const PROBLEMS = [
  { icon: "🖨️", text: "Print the assignment. Now.", tag: "URGENT" },
  { icon: "🧺", text: "My clothes — washed by 6pm." },
  { icon: "🔋", text: "Charger died. Again." },
  { icon: "📦", text: "Move my boxes to Block C." },
];

export const CampusPausesScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  return (
    <CopyScene startFrame={startFrame} bg={palette.ink}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 42,
          padding: "0 60px",
          maxWidth: 900,
          width: "100%",
        }}
      >
        <CopyBlock
          startFrame={startFrame}
          kicker="FUOYE · 7:42 AM"
          headline="Campus life never waits."
          sub="A hundred small emergencies a day. Nobody to call. Nowhere to turn."
          light
          align="center"
        />
        <Stagger startFrame={startFrame + 55} gapFrame={9} direction="up">
          {PROBLEMS.map((p) => (
            <div
              key={p.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                backgroundColor: palette.inkCard,
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 18,
                padding: "15px 22px",
                minWidth: 420,
              }}
            >
              <span style={{ fontSize: 26 }}>{p.icon}</span>
              <span style={{ flex: 1, fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: fonts.body }}>
                {p.text}
              </span>
              {p.tag && (
                <span style={{ fontSize: 11, fontWeight: 800, color: palette.gold, backgroundColor: "rgba(234,163,37,0.15)", borderRadius: 999, padding: "4px 10px", fontFamily: fonts.body }}>
                  {p.tag}
                </span>
              )}
            </div>
          ))}
        </Stagger>
        <div
          style={{
            opacity: interpolateSafe(local, 240, 300, 0, 1),
            fontSize: 19,
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            fontFamily: fonts.body,
            letterSpacing: 0.4,
          }}
        >
          …what if help was one tap away?
        </div>
      </div>
    </CopyScene>
  );
};

function interpolateSafe(local: number, from: number, to: number, a: number, b: number) {
  const t = Math.max(0, Math.min(1, (local - from) / (to - from)));
  return a + (b - a) * (1 - (1 - t) * (1 - t));
}

/* ────────────────────────────── Scene 2: Reveal ───────────────────────────── */

export const MeetNeedFullScene: React.FC<SceneProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  return (
    <CopyScene
      startFrame={startFrame}
      bg={`linear-gradient(150deg, ${palette.green} 0%, ${palette.greenDark} 100%)`}
    >
      <Flash startFrame={startFrame} color="#fff" maxOpacity={0.9} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <PopIn startFrame={startFrame + 12} scaleTo={1}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 38,
              background: "rgba(255,255,255,0.12)",
              border: "2.5px solid rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 58,
              fontWeight: 900,
              color: "#fff",
              fontFamily: fonts.display,
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              position: "relative",
            }}
          >
            NF
            <div
              style={{
                position: "absolute",
                right: 26,
                top: 26,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: palette.gold,
              }}
            />
          </div>
        </PopIn>
        <div
          style={{
            opacity: interpolateSafe(local, 38, 80, 0, 1),
            transform: `translateY(${(1 - interpolateSafe(local, 38, 80, 0, 1)) * 24}px)`,
            fontSize: 74,
            fontWeight: 900,
            letterSpacing: -2,
            color: "#fff",
            fontFamily: fonts.display,
          }}
        >
          NeedFull
        </div>
        <div
          style={{
            opacity: interpolateSafe(local, 62, 100, 0, 1),
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: palette.gold,
            fontFamily: fonts.body,
          }}
        >
          Your campus. Your hustle. Real money.
        </div>
        <Stagger startFrame={startFrame + 96} gapFrame={7}>
          {["Post a task", "Find runners", "Escrow-secured"].map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: fonts.body,
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                borderRadius: 999,
                padding: "9px 20px",
              }}
            >
              {chip}
            </span>
          ))}
        </Stagger>
      </div>
    </CopyScene>
  );
};

/* ─────────────────────────── Scene 3: Post a Task ─────────────────────────── */

export const PostTaskScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const stage: PostStage =
    local < 120 ? "title" : local < 225 ? "budget" : local < 320 ? "category" : local < 370 ? "publish" : "done";

  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 6}
          kicker="For Seekers"
          headline="Post it in 60 seconds."
          sub="Describe the task. Set the price. It's live — and escrow protects you both."
        />
      }
      cursor={{
        keyframes: [
          { t: 0, x: 0.78, y: 0.06 },
          { t: 0.12, x: 0.5, y: 0.16 },
          { t: 0.36, x: 0.5, y: 0.27 },
          { t: 0.52, x: 0.28, y: 0.38 },
          { t: 0.68, x: 0.5, y: 0.8 },
          { t: 0.84, x: 0.5, y: 0.8 },
          { t: 1, x: 0.5, y: 0.8 },
        ],
        clicks: [
          { frame: startFrame + 55 },
          { frame: startFrame + 155 },
          { frame: startFrame + 235 },
          { frame: startFrame + 295 },
        ],
        startFrame,
        durationFrames: 330,
      }}
    >
      <PhoneFrame>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <PostTaskScreen stage={stage} />
          {stage === "done" && (
            <div style={{ position: "absolute", top: 92, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
              <NotificationToast
                startFrame={startFrame + 380}
                icon="✅"
                title="Task published"
                body="₦1,500 secured in escrow — runners notified"
              />
            </div>
          )}
        </div>
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ────────────────────────── Scene 4: Runner Discovers ─────────────────────── */

export const RunnerScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const showDetail = local >= 110;
  const applied = local >= 260;

  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 6}
          kicker="For Runners"
          headline="A runner nearby. Payment secured."
          sub="New task notifications. One-tap apply. The money sits in escrow until the job is done."
        />
      }
      cursor={{
        keyframes: [
          { t: 0, x: 0.8, y: 0.1 },
          { t: 0.14, x: 0.5, y: 0.46 },
          { t: 0.3, x: 0.5, y: 0.46 },
          { t: 0.45, x: 0.5, y: 0.8 },
          { t: 0.62, x: 0.5, y: 0.8 },
          { t: 0.8, x: 0.5, y: 0.8 },
          { t: 0.9, x: 0.72, y: 0.1 },
          { t: 1, x: 0.72, y: 0.1 },
        ],
        clicks: [
          { frame: startFrame + 85 },
          { frame: startFrame + 250 },
        ],
        startFrame,
        durationFrames: 340,
      }}
    >
      <PhoneFrame>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {showDetail ? (
            <TaskDetailScreen task={undefined} applied={applied} />
          ) : (
            <FeedScreen tasksCount={3} startFrame={startFrame} />
          )}
          {local < 110 && (
            <div style={{ position: "absolute", top: 76, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
              <NotificationToast
                startFrame={startFrame + 15}
                icon="🔔"
                title="New task near you"
                body="Print my assignment — ₦1,500 · 0.8km"
              />
            </div>
          )}
          {applied && (
            <div style={{ position: "absolute", top: 76, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
              <NotificationToast
                startFrame={startFrame + 270}
                icon="🤝"
                title="Amina accepted your application"
                body="₦1,500 secured in escrow · chat now"
                accent={palette.gold}
              />
            </div>
          )}
        </div>
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ─────────────────────────────── Scene 5: Chat ────────────────────────────── */

export const ChatScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 6}
          kicker="Coordinate"
          headline="Agree the details. In real time."
          sub="Live chat inside the task. No phone numbers exchanged — everything stays on record."
        />
      }
      cursor={{
        keyframes: [
          { t: 0, x: 0.55, y: 0.45 },
          { t: 0.22, x: 0.34, y: 0.87 },
          { t: 0.5, x: 0.34, y: 0.87 },
          { t: 1, x: 0.3, y: 0.87 },
        ],
        clicks: [{ frame: startFrame + 150 }],
        startFrame,
        durationFrames: 250,
      }}
    >
      <PhoneFrame>
        <ChatScreen startFrame={startFrame + 30} />
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ─────────────────────────── Scene 6: Escrow Release ──────────────────────── */

export const EscrowReleaseScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 6}
          kicker="The Payoff"
          headline="Done. Paid. Both protected."
          sub="Runner confirms. Seeker confirms. Escrow releases — instantly, safely, on record."
        />
      }
    >
      <PhoneFrame>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <WalletScreen startFrame={startFrame + 80} creditAmount={1500} />
          <div style={{ position: "absolute", top: 80, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
            <NotificationToast
              startFrame={startFrame + 60}
              icon="🤑"
              title="Payment released from escrow"
              body="+₦1,500 credited to your wallet"
            />
          </div>
        </div>
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ─────────────────────────────── Scene 7: Rating ──────────────────────────── */

export const RatingScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  const { width, height } = useVideoConfig();
  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 6}
          kicker="Trust"
          headline="Great work builds trust."
          sub="Rate and review after every task. High trust = more tasks, better pay."
        />
      }
    >
      <PhoneFrame>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <RatingScreen startFrame={startFrame + 40} />
          <Confetti
            startFrame={startFrame + 130}
            width={390}
            height={844}
            seed={9}
            count={70}
          />
        </div>
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ──────────────────────────── Scene 8: Marketplace ────────────────────────── */

export const MarketplaceScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  return (
    <DeviceScene
      startFrame={startFrame}
      bg={palette.surface}
      copy={
        <CopyBlock
          startFrame={startFrame + 4}
          kicker="The Marketplace"
          headline="One campus. Thousands of tasks. Every day."
          sub="Printing, laundry, deliveries, errands — NeedFull keeps the campus economy moving."
        />
      }
    >
      <PhoneFrame>
        <MarketplaceGrid startFrame={startFrame + 20} cols={2} />
      </PhoneFrame>
    </DeviceScene>
  );
};

/* ──────────────────────────────── Scene 9: CTA ────────────────────────────── */

export const CTAScene: React.FC<SceneProps> = ({ startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  return (
    <CopyScene
      startFrame={startFrame}
      bg={`linear-gradient(150deg, ${palette.greenDark} 0%, ${palette.green} 55%, ${palette.greenLight} 100%)`}
    >
      <Flash startFrame={startFrame} color="#fff" maxOpacity={0.85} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, padding: "0 40px", textAlign: "center" }}>
        <PopIn startFrame={startFrame + 14} scaleTo={1}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "rgba(255,255,255,0.14)",
              border: "2.5px solid rgba(255,255,255,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 900,
              color: "#fff",
              fontFamily: fonts.display,
              position: "relative",
            }}
          >
            NF
            <div
              style={{
                position: "absolute",
                right: 18,
                top: 18,
                width: 13,
                height: 13,
                borderRadius: "50%",
                backgroundColor: palette.gold,
              }}
            />
          </div>
        </PopIn>
        <CopyBlock
          startFrame={startFrame + 8}
          headline="Need something? NeedFull it."
          sub="Post a task. Take a task. Get paid — the safe way."
          light
          align="center"
        />
        <PopIn startFrame={startFrame + 42}>
          <div
            style={{
              backgroundColor: palette.gold,
              color: palette.ink,
              fontWeight: 900,
              fontSize: 21,
              fontFamily: fonts.body,
              borderRadius: 999,
              padding: "16px 44px",
              boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
            }}
          >
            Start posting · Start earning
          </div>
        </PopIn>
        <div
          style={{
            opacity: interpolateSafe(frame - startFrame, 60, 90, 0, 1),
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.75)",
            fontFamily: fonts.body,
          }}
        >
          NEEDFULL.APP
        </div>
      </div>
    </CopyScene>
  );
};