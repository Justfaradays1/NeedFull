# NeedFull Studio

Animated marketing stories (“brand videos”) for NeedFull, built with **Remotion**.
Every story renders at 16:9 (YouTube/Twitter), 9:16 (Reels/Shorts/TikTok), and 1:1
(Feed) from a **single scene definition** — same cut, same cursor moves, same audio.

```
apps/studio/
├─ src/
│  ├─ studio/            # the video engine (brand, motion, data, screens, stories)
│  │  ├─ brand/          # tokens: palette, fonts, ratios — mirrors production brand
│  │  ├─ motion/         # transitions, cursor engine, count-up, confetti, toasts
│  │  ├─ data/           # fake students, tasks, chats, reviews, wallets
│  │  ├─ components/     # mock UI: phone/browser frames, feed, chat, wallet, rating…
│  │  ├─ audio/          # timeline engine + SFX library (synthesized WAVs)
│  │  ├─ story/          # story system: types, engine, registry, ratio layouts
│  │  ├─ stories/        # 📄 LIVE HERE: each story is a folder
│  │  └─ index.tsx       # Remotion root (registerRoot)
│  ├─ app/               # Next.js dashboard: preview, settings, one-click render
│  │  └─ api/render/     # render job API: POST /api/render → GET [id] → file
│  └─ lib/               # render job store
├─ scripts/generate-audio.mjs   # synthesizes every SFX + ambient bed as WAV
└─ out/                  # rendered videos (gitignored)
```

## Daily workflow

```bash
cd apps/studio
npm i
npm run audio     # regenerate SFX only when scripts/generate-audio.mjs changes
npm run dev       # dashboard → http://localhost:3001
```

In the dashboard: pick a story → aspect ratio → render scale → SFX/music toggles →
**Render video** (queues one job, polls status, downloads the MP4 when done).

Or from the CLI (no dashboard needed):

```bash
npx remotion render src/studio/index.tsx what-is-needfull-16x9 out/what-is-needfull.mp4
# options: --scale=2 (4K-ish), --props='{"audio":{"sfx":false,"music":true}}',
#          --frames=500-830 (preview a scene range only)
```

First render downloads a headless Chrome (~113 MB); after that it's cached.

## Adding a new story (the whole point)

1. **Copy a scene file** — `src/studio/stories/<your-story>/scenes.tsx` made of
   `DeviceScene` / `CopyScene` + the shared screens. See `what-is-needfull/` as
   the reference implementation.
2. **Cut the timeline** in `index.tsx`: scenes with `startFrame`/`durationFrames`,
   plus an `audioEvents` list (`ev(frame, "click")`) if you want SFX.
3. **Register** the story in `src/studio/story/registry.ts` (one line).
   The dashboard, the Player preview, and both render paths pick it up
   automatically at every ratio.

Rules that keep stories render-safe:
- All timing uses `useCurrentFrame()` — never `Date.now()`/`setTimeout`.
- All randomness uses `mulberry32(seed)` — deterministic across frames.
- Everything renders without network: system fonts only, WAVs in `public/audio`.
- Cursor clicks reference composition-absolute frames; coords are normalized.

## Rendering notes

- Output MP4s land in `apps/studio/out/` (gitignored).
- One job at a time (single Chrome instance); long renders are fine to leave
  running in the dashboard tab.
- If the bundled headless shell ever fails to boot, point at system Chrome:
  `--browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe"`