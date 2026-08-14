// WHAT: Studio dashboard — story list, aspect-ratio/resolution/audio settings,
//       live preview via Remotion Player, and one-click renders via the API.

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { getCompositionRegistrations } from "@/studio/story/registry";
import { StoryDefinition, StoryProps } from "@/studio/story/types";
import { StoryPlayer } from "@/studio/story/StoryComposition";
import { Ratio, ratioSize } from "@/studio/brand/tokens";

const registrations = getCompositionRegistrations();
const stories = new Map<string, StoryDefinition>();
for (const reg of registrations) stories.set(reg.story.id, reg.story);
const storyList = [...stories.values()];

function playerFor(story: StoryDefinition): React.FC<StoryProps> {
  const C: React.FC<StoryProps> = (props) => <StoryPlayer story={story} {...props} />;
  return C;
}

type JobState = { id: string; status: "rendering" | "done" | "error"; message?: string };

export default function StudioDashboard() {
  const [storyId, setStoryId] = useState(storyList[0]?.id ?? "");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [scale, setScale] = useState(1);
  const [sfx, setSfx] = useState(true);
  const [music, setMusic] = useState(true);
  const [job, setJob] = useState<JobState | null>(null);

  const story = stories.get(storyId)!;
  const reg = registrations.find((r) => r.story.id === storyId && r.ratio === ratio)!;
  const size = ratioSize[ratio];

  const component = useMemo(() => playerFor(story), [story]);
  const inputProps = useMemo(() => ({ audio: { sfx, music } }), [sfx, music]);

  useEffect(() => {
    if (!job || job.status !== "rendering") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/render/${job.id}`);
      const data = await res.json();
      if (data.status !== "rendering") {
        setJob({ id: job.id, status: data.status, message: data.message });
        clearInterval(t);
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job]);

  const startRender = async () => {
    setJob(null);
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reg.id, ratio, scale, sfx, music }),
    });
    const data = await res.json();
    setJob({ id: data.jobId, status: "rendering" });
  };

  const tSec = (f: number) => (f / story.fps).toFixed(1);

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1A6B4A, #125038)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 16,
              color: "#fff",
            }}
          >
            NF
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.4 }}>Studio</div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              story-driven marketing videos
            </div>
          </div>
        </div>

        <div className="studio-label">Stories</div>
        {storyList.map((s) => (
          <button
            key={s.id}
            onClick={() => setStoryId(s.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: s.id === storyId ? "#1E2B25" : "transparent",
              border: "none",
              borderRadius: 10,
              padding: "11px 13px",
              cursor: "pointer",
              marginBottom: 6,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13.5, color: s.id === storyId ? "#fff" : "#B9C6BF" }}>
              {s.title}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 3, lineHeight: 1.45 }}>
              {s.description}
            </div>
          </button>
        ))}

        <div className="studio-label" style={{ marginTop: 22 }}>Scenes · {story.scenes.length}</div>
        {story.scenes.map((sc, i) => (
          <div key={sc.id} className="studio-scene-row">
            <span className="idx">{i + 1}</span>
            <span className="frame">
              {tSec(sc.startFrame)}s → {tSec(sc.startFrame + sc.durationFrames)}s
            </span>
            <span style={{ flex: 1 }}>{sc.title}</span>
          </div>
        ))}

        <div className="studio-label" style={{ marginTop: 22 }}>Audio</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="studio-toggle">
            <input type="checkbox" checked={sfx} onChange={(e) => setSfx(e.target.checked)} />
            Sound effects
          </label>
          <label className="studio-toggle">
            <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} />
            Ambient music
          </label>
        </div>
      </aside>

      <main className="studio-main">
        <div className="studio-card">
          <div className="studio-label">Aspect ratio</div>
          <div className="studio-radio">
            {(["16:9", "9:16", "1:1"] as Ratio[]).map((r) => (
              <label key={r} className={r === ratio ? "active" : ""} onClick={() => setRatio(r)}>
                {r}
              </label>
            ))}
          </div>
          <div className="studio-label" style={{ marginTop: 18 }}>
            Render resolution
          </div>
          <div className="studio-radio">
            {[1, 2].map((s) => (
              <label key={s} className={s === scale ? "active" : ""} onClick={() => setScale(s)}>
                {s === 1 ? `${size.width}×${size.height}` : `${size.width * s}×${size.height * s}`}
              </label>
            ))}
          </div>
        </div>

        <div className="studio-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{story.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {story.durationFrames / story.fps}s · {story.fps} fps · {reg.id}
              </div>
            </div>
            <button className="studio-btn" onClick={startRender} disabled={!!job && job.status === "rendering"}>
              {job?.status === "rendering" ? "Rendering…" : "Render video"}
            </button>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              maxWidth: ratio === "9:16" ? 420 : 900,
              margin: "0 auto",
            }}
          >
            <Player
              component={component}
              inputProps={inputProps}
              durationInFrames={story.durationFrames}
              fps={story.fps}
              compositionWidth={size.width}
              compositionHeight={size.height}
              numberOfSharedAudioTags={24}
              acknowledgeRemotionLicense
              style={{ width: "100%" }}
              controls
              loop
            />
          </div>
        </div>

        {job && (
          <div className="studio-card">
            <div className="studio-label">Last render</div>
            <div className="studio-job">
              <span className={`pill ${job.status}`}>{job.status}</span>
              {job.status === "rendering" ? (
                <span className="muted">Rendering {reg.id} @ {scale}x — this runs in the background, keep this tab open.</span>
              ) : job.status === "done" ? (
                <span>
                  <span className="gold">Ready.</span>{" "}
                  <a href={`/api/render/${job.id}/file`} download>
                    Download MP4 ↓
                  </a>
                </span>
              ) : (
                <span style={{ color: "#F4B8B0" }}>{job.message}</span>
              )}
            </div>
          </div>
        )}

        <div className="studio-card">
          <div className="studio-label">Timeline (scene frame ranges)</div>
          <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
            {story.scenes.map((sc, i) => (
              <span key={sc.id}>
                <b className="gold">{i + 1}. {sc.title}</b> @ {sc.startFrame}–{sc.startFrame + sc.durationFrames}f ·{" "}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}