// WHAT: Render API — kicks off a Remotion render job (queue of 1) and returns
//       a jobId. Status is polled at GET /api/render/[id].

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { getJob, saveJob, isRendering, RenderJob } from "@/lib/render-jobs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, scale = 1, sfx = true, music = true } = body as {
    id?: string;
    scale?: number;
    sfx?: boolean;
    music?: boolean;
  };

  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: "invalid composition id" }, { status: 400 });
  }
  if (isRendering()) {
    return NextResponse.json({ error: "a render is already running" }, { status: 409 });
  }

  const studioRoot = process.cwd();
  const outDir = path.join(studioRoot, "out");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const job: RenderJob = {
    id: randomUUID().slice(0, 8),
    compositionId: id,
    scale,
    outputPath: path.join(outDir, `${id}.mp4`),
    status: "rendering",
  };
  saveJob(job);

  const entry = path.join(studioRoot, "src", "studio", "index.tsx");
  const propsFile = path.join(outDir, `props-${job.id}.json`);
  fs.writeFileSync(propsFile, JSON.stringify({ audio: { sfx, music } }));

  const args = [
    "remotion",
    "render",
    entry,
    job.compositionId,
    job.outputPath,
    `--scale=${job.scale}`,
    `--props=${propsFile}`,
    "--log=error",
  ];

  const child = spawn("npx", args, {
    cwd: studioRoot,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (d) => (stderr += d.toString()));
  child.on("error", (err) => {
    job.status = "error";
    job.error = err.message;
    saveJob(job);
    try { fs.unlinkSync(propsFile); } catch {}
  });
  child.on("close", (code) => {
    if (code === 0 && fs.existsSync(job.outputPath)) {
      job.status = "done";
    } else {
      job.status = "error";
      job.error = stderr.slice(-400) || `render exited with code ${code}`;
    }
    saveJob(job);
    try { fs.unlinkSync(propsFile); } catch {}
  });

  return NextResponse.json({ jobId: job.id });
}