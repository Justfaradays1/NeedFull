// WHAT: Task-related phone screens — feed, post-a-task flow, task detail.

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { palette, fonts, radii, shadows } from "../brand/tokens";
import { tasks, TaskItem, avatarOf, naira, taskCategories } from "../data/fake-data";
import { Avatar, AppHeader } from "./shell";
import { PopIn, Stagger } from "../motion/transitions";

// WHAT: A single task card
export const TaskCard: React.FC<{ task: TaskItem; scale?: number; shimmer?: boolean }> = ({
  task,
  scale = 1,
  shimmer = false,
}) => {
  const poster = avatarOf(task.poster);
  return (
    <div
      style={{
        backgroundColor: palette.card,
        borderRadius: radii.md,
        border: `1px solid ${palette.line}`,
        boxShadow: "0 4px 18px rgba(12,18,16,0.07)",
        padding: "13px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: palette.green,
            backgroundColor: palette.greenSoft,
            borderRadius: 999,
            padding: "3.5px 9px",
            fontFamily: fonts.body,
          }}
        >
          {task.category}
        </span>
        {task.urgent && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: palette.error,
              backgroundColor: palette.errorSoft,
              borderRadius: 999,
              padding: "3px 8px",
              letterSpacing: 0.5,
              fontFamily: fonts.body,
            }}
          >
            URGENT
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontWeight: 800,
            fontSize: 15,
            color: palette.goldDark,
            fontFamily: fonts.display,
          }}
        >
          {naira(task.budgetNaira)}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: palette.text, fontFamily: fonts.body, lineHeight: 1.35 }}>
        {task.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: palette.textMuted, fontFamily: fonts.body }}>
        <span>📍 {task.location}</span>
        {task.distanceKm ? <span>· {task.distanceKm}km away</span> : null}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Avatar student={poster} size={20} />
          <span>{poster.name.split(" ")[0]}</span>
        </div>
      </div>
      {shimmer && (
        <div
          style={{
            height: 5,
            borderRadius: 999,
            backgroundColor: palette.surfaceAlt,
          }}
        />
      )}
    </div>
  );
};

// WHAT: The main feed / "Find Tasks" screen
export const FeedScreen: React.FC<{ showSearch?: boolean; tasksCount?: number; startFrame?: number }> = ({
  showSearch = true,
  tasksCount = 3,
  startFrame = 0,
}) => {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader />
      <div style={{ padding: "13px 14px 0", display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "hidden" }}>
        {showSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: palette.card,
              border: `1px solid ${palette.line}`,
              borderRadius: 999,
              padding: "10px 14px",
              fontSize: 12,
              color: palette.textFaint,
              fontFamily: fonts.body,
            }}
          >
            🔍 Find tasks near you…
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 800, color: palette.text, fontFamily: fonts.display }}>
          Near you
          <span style={{ color: palette.textFaint, fontWeight: 600, marginLeft: 6, fontSize: 11 }}>
            {tasksCount} tasks
          </span>
        </div>
        <Stagger startFrame={startFrame} gapFrame={6}>
          {tasks.slice(0, tasksCount).map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </Stagger>
        <div style={{ flex: 1 }} />
        {/* bottom nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "11px 14px 20px",
            backgroundColor: palette.card,
            borderTop: `1px solid ${palette.line}`,
            fontSize: 17,
          }}
        >
          {["🏠", "🔍", "➕", "💬", "👤"].map((icon, i) => (
            <span key={i} style={{ opacity: i === 0 ? 1 : 0.35 }}>
              {icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// WHAT: Stage-driven "post a task" flow — the cursor drives each stage
export type PostStage = "title" | "budget" | "category" | "publish" | "done";

export const PostTaskScreen: React.FC<{ stage: PostStage; title?: string; budget?: number }> = ({
  stage,
  title = "Print my assignment — 60 pages",
  budget = 1500,
}) => {
  const typedTitle = title.slice(0, Math.min(title.length, stage === "title" ? title.length : title.length));
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader title="Post a Task" />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14, flex: 1, overflow: "hidden" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, marginBottom: 6, fontFamily: fonts.body }}>
            WHAT DO YOU NEED?
          </div>
          <div
            style={{
              backgroundColor: palette.card,
              border: `2px solid ${stage === "title" ? palette.green : palette.line}`,
              borderRadius: radii.sm,
              padding: "12px 13px",
              fontSize: 13.5,
              fontWeight: 600,
              color: palette.text,
              fontFamily: fonts.body,
              position: "relative",
            }}
          >
            {typedTitle}
            {stage === "title" && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 15,
                  backgroundColor: palette.green,
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                }}
              />
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, marginBottom: 6, fontFamily: fonts.body }}>
            YOUR BUDGET (₦)
          </div>
          <div
            style={{
              backgroundColor: palette.card,
              border: `2px solid ${stage === "budget" ? palette.green : palette.line}`,
              borderRadius: radii.sm,
              padding: "12px 13px",
              fontSize: 17,
              fontWeight: 800,
              color: palette.goldDark,
              fontFamily: fonts.display,
            }}
          >
            {stage === "budget" || stage === "category" || stage === "publish" || stage === "done"
              ? naira(budget)
              : "Enter amount"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, marginBottom: 7, fontFamily: fonts.body }}>
            CATEGORY
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {taskCategories.map((c) => {
              const selected = c === "Printing";
              const active = stage === "category" && c === "Printing";
              return (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: fonts.body,
                    borderRadius: 999,
                    padding: "7px 12px",
                    backgroundColor: active || selected ? palette.green : palette.card,
                    color: active || selected ? "#fff" : palette.textMuted,
                    border: `1.5px solid ${active || selected ? palette.green : palette.line}`,
                    transition: "none",
                  }}
                >
                  {selected && stage !== "title" && stage !== "budget" ? "✓ " : ""}
                  {c}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <PopIn startFrame={stage === "publish" || stage === "done" ? 0 : -9999}>
          <div
            style={{
              backgroundColor: palette.gold,
              borderRadius: radii.sm,
              padding: "14px",
              textAlign: "center",
              fontWeight: 800,
              color: palette.ink,
              fontSize: 14,
              fontFamily: fonts.body,
              boxShadow: shadows.glow,
            }}
          >
            {stage === "done" ? "✓ PUBLISHED — escrow secured" : "Publish Task"}
          </div>
        </PopIn>

        <div style={{ height: 18 }} />
      </div>
    </div>
  );
};

// WHAT: Task detail screen with Apply CTA + escrow callout
export const TaskDetailScreen: React.FC<{
  task?: TaskItem;
  applied?: boolean;
  escrowNote?: boolean;
  startFrame?: number;
}> = ({ task = tasks[0], applied = false, escrowNote = true, startFrame = 0 }) => {
  const poster = avatarOf(task.poster);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: palette.surface }}>
      <AppHeader title="Task Details" />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11, flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Avatar student={poster} size={36} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 12.5, fontFamily: fonts.body, color: palette.text }}>{task.poster}</div>
            <div style={{ fontSize: 10, color: palette.textFaint, fontFamily: fonts.body }}>
              ★ {poster.rating.toFixed(1)} · Trust {poster.trustScore}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: palette.green,
              backgroundColor: palette.greenSoft,
              borderRadius: 999,
              padding: "4px 9px",
              fontFamily: fonts.body,
            }}
          >
            {task.urgent ? "⚡ URGENT" : "OPEN"}
          </span>
        </div>

        <div style={{ fontWeight: 800, fontSize: 15.5, fontFamily: fonts.display, color: palette.text, lineHeight: 1.4 }}>
          {task.title}
        </div>

        <Stagger startFrame={startFrame} gapFrame={5}>
          <div
            style={{
              backgroundColor: palette.card,
              border: `1px solid ${palette.line}`,
              borderRadius: radii.md,
              padding: "12px 13px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 11, color: palette.textMuted, fontFamily: fonts.body }}>Budget</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: palette.goldDark, fontFamily: fonts.display }}>
              {naira(task.budgetNaira)}
            </div>
          </div>
          <div
            style={{
              backgroundColor: palette.card,
              border: `1px solid ${palette.line}`,
              borderRadius: radii.md,
              padding: "12px 13px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 11, color: palette.textMuted, fontFamily: fonts.body }}>Location</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: palette.text, fontFamily: fonts.body }}>
              📍 {task.location} {task.distanceKm ? `· ${task.distanceKm}km` : ""}
            </div>
          </div>
        </Stagger>

        {escrowNote && (
          <div
            style={{
              backgroundColor: palette.warningSoft,
              border: `1px solid ${palette.gold}55`,
              borderRadius: radii.sm,
              padding: "9px 12px",
              fontSize: 10.5,
              color: palette.goldDark,
              fontFamily: fonts.body,
              fontWeight: 600,
            }}
          >
            🔒 Your payment is held securely in escrow — released only when the task is done.
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            backgroundColor: applied ? palette.green : palette.gold,
            borderRadius: radii.sm,
            padding: "13px",
            textAlign: "center",
            fontWeight: 800,
            fontSize: 13.5,
            fontFamily: fonts.body,
            color: applied ? "#fff" : palette.ink,
            boxShadow: applied ? "none" : shadows.glow,
          }}
        >
          {applied ? "✓ Applied — awaiting poster" : "Apply for this Task"}
        </div>
        <div style={{ height: 18 }} />
      </div>
    </div>
  );
};