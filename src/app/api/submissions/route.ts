import { NextResponse } from "next/server";
import { submissionDb } from "@/lib/submissions/store.server";
import type { SubmissionInput } from "@/lib/submissions/types";

// GET  /api/submissions?userId=&lessonId=  → that user's submissions (newest first)
// POST /api/submissions                    → create a DRAFT or SUBMITTED attempt
//
// Execution-engine-agnostic: this records the submission and its lifecycle.
// A grader (browser interpreter today, server worker later) reports verdicts
// via PATCH /api/submissions/:id. The store behind this is pluggable.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const lessonId = url.searchParams.get("lessonId") ?? undefined;
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const submissions = await submissionDb.list(userId, lessonId);
  return NextResponse.json(submissions);
}

export async function POST(req: Request) {
  let body: Partial<SubmissionInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (
    typeof body?.userId !== "string" ||
    typeof body?.lessonId !== "string" ||
    typeof body?.code !== "string" ||
    typeof body?.blockIndex !== "number"
  ) {
    return NextResponse.json(
      { error: "userId, lessonId, blockIndex and code are required" },
      { status: 400 },
    );
  }
  const sub = await submissionDb.create({
    userId: body.userId,
    lessonId: body.lessonId,
    blockIndex: body.blockIndex,
    code: body.code,
    tier: body.tier === "certification" ? "certification" : "practice",
    submit: body.submit === true,
  });
  return NextResponse.json(sub, { status: 201 });
}
