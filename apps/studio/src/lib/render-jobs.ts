// WHAT: File-backed render job store. Next.js dev bundles each route
//       separately, so in-memory maps are NOT shared between POST/GET
//       handlers — the file is the single source of truth.

import fs from "fs";
import path from "path";

export interface RenderJob {
  id: string;
  compositionId: string;
  scale: number;
  outputPath: string;
  status: "rendering" | "done" | "error";
  error?: string;
}

function jobFile() {
  const dir = path.join(process.cwd(), "out");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, ".jobs.json");
}

function readAll(): RenderJob[] {
  try {
    return JSON.parse(fs.readFileSync(jobFile(), "utf-8")) as RenderJob[];
  } catch {
    return [];
  }
}

function writeAll(jobs: RenderJob[]) {
  fs.writeFileSync(jobFile(), JSON.stringify(jobs, null, 2));
}

export function getJob(id: string): RenderJob | undefined {
  return readAll().find((j) => j.id === id);
}

export function saveJob(job: RenderJob) {
  const jobs = readAll();
  const i = jobs.findIndex((j) => j.id === job.id);
  if (i >= 0) jobs[i] = job;
  else jobs.push(job);
  writeAll(jobs);
}

export function isRendering(): boolean {
  return readAll().some((j) => j.status === "rendering");
}
