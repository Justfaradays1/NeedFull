// WHAT: Serves the rendered MP4 for download.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getJob } from "@/lib/render-jobs";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job || job.status !== "done" || !fs.existsSync(job.outputPath)) {
    return NextResponse.json({ error: "render not ready" }, { status: 404 });
  }
  const buf = fs.readFileSync(job.outputPath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${job.compositionId}.mp4"`,
      "Content-Length": String(buf.length),
    },
  });
}