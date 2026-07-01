import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSnapfinderConfig, ingestUrls, triggerClustering } from "@/lib/snapfinder";

// Admin-only one-time (re-runnable) backfill: register every image already in
// the gallery with the SnapFinder face index. Ingestion is idempotent on
// SnapFinder's side (unique per event+url), so this is safe to run repeatedly.
// Videos are skipped — they aren't face-indexed.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getSnapfinderConfig()) {
    return NextResponse.json(
      { error: "SnapFinder is not configured (SNAPFINDER_API_URL / EVENT_ID / JWT_SECRET)." },
      { status: 503 }
    );
  }

  const images = await prisma.guestPhoto.findMany({
    where: { type: "image" },
    select: { url: true },
    orderBy: { createdAt: "asc" }
  });

  try {
    const { queued, skipped } = await ingestUrls(images.map((p) => p.url));
    // Best-effort: kick a recluster so the people grid picks up new faces.
    // (Runs over whatever is already embedded; re-run after processing settles
    // via /api/people/recluster to capture the just-queued photos.)
    try {
      await triggerClustering();
    } catch {
      // non-fatal — clustering can be retriggered by admin
    }
    return NextResponse.json({ total: images.length, queued, skipped });
  } catch (err) {
    console.error("backfill-index failed", err);
    return NextResponse.json({ error: "Backfill failed — see server logs." }, { status: 502 });
  }
}
