import { NextResponse } from "next/server";
import { db } from "@/lib/progress/store.server";
import { EMPTY_SNAPSHOT, type ProgressSnapshot } from "@/lib/progress/backend";

// GET  /api/progress/:userId  → that user's stored snapshot (empty if new)
// PUT  /api/progress/:userId  → merge + persist the posted snapshot
//
// The store behind this is pluggable (see store.server.ts); the in-memory
// default makes cross-tab / cross-device sync work against one running server.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const snap = (await db.get(userId)) ?? EMPTY_SNAPSHOT;
  return NextResponse.json(snap);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  let body: ProgressSnapshot;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const snapshot: ProgressSnapshot = {
    completed: Array.isArray(body?.completed) ? body.completed.filter((x) => typeof x === "string") : [],
    activity: body?.activity && typeof body.activity === "object" ? body.activity : {},
  };
  const saved = await db.put(userId, snapshot);
  return NextResponse.json(saved);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  await db.del(userId);
  return NextResponse.json({ ok: true });
}
