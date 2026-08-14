// WHAT: Job status endpoint — polled by the dashboard while rendering.

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/render-jobs";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return NextResponse.json({ status: "error", message: "unknown job" }, { status: 404 });
  return NextResponse.json({
    id: job.id,
    status: job.status,
    message: job.error,
    compositionId: job.compositionId,
  });
}