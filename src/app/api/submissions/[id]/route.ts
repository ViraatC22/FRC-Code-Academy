import { NextResponse } from "next/server";
import { submissionDb } from "@/lib/submissions/store.server";
import { isIllegalTransition } from "@/lib/submissions/lifecycle";
import type { SubmissionRun, SubmissionState } from "@/lib/submissions/types";

// GET   /api/submissions/:id  → one submission with its run history
// PATCH /api/submissions/:id  → advance lifecycle: either { state } to move a
//                               step (e.g. SUBMITTED→QUEUED) or { run } to
//                               record a grader verdict and reach a terminal
//                               state. Illegal transitions are rejected 409.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sub = await submissionDb.get(id);
  if (!sub) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { state?: SubmissionState; run?: SubmissionRun };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  try {
    if (body.run) {
      const saved = await submissionDb.recordRun(id, { ...body.run, submissionId: id });
      return NextResponse.json(saved);
    }
    if (body.state) {
      const saved = await submissionDb.setState(id, body.state);
      return NextResponse.json(saved);
    }
    return NextResponse.json(
      { error: "provide either { state } or { run }" },
      { status: 400 },
    );
  } catch (err) {
    if (isIllegalTransition(err)) {
      return NextResponse.json({ error: (err as Error).message }, { status: 409 });
    }
    // Unknown id surfaces from the store as a plain Error.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 404 },
    );
  }
}
