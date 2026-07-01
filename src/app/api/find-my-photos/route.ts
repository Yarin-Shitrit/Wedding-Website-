import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchSelfies } from "@/lib/snapfinder";

// Public selfie-match proxy. The browser uploads a (client-downscaled) selfie
// here; we forward it to SnapFinder holding the event token + service URL
// server-side, then map the matched Blob URLs back to GuestPhoto rows so the
// client renders real gallery items (with working per-item + ZIP downloads).
//
// SnapFinder processes the selfie in RAM and discards it; we never store it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Response phases the client understands.
type Phase = "results" | "no-matches" | "no-face" | "error";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  uploaderName: string | null;
  distance: number;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ phase: "error" as Phase, items: [] }, { status: 400 });
  }

  // Accept the selfie under "files" (SnapFinder's field name) or "file".
  const files = [...form.getAll("files"), ...form.getAll("file")].filter(
    (v): v is File => v instanceof File
  );
  if (files.length === 0) {
    return NextResponse.json({ phase: "error" as Phase, items: [] }, { status: 400 });
  }

  const outcome = await matchSelfies(files);

  if (!outcome.ok) {
    if (outcome.kind === "no-face") {
      return NextResponse.json({ phase: "no-face" as Phase, items: [] });
    }
    // not-configured or upstream/network error — generic failure to the client.
    return NextResponse.json({ phase: "error" as Phase, items: [] }, { status: 502 });
  }

  const matched = outcome.data.results;
  if (matched.length === 0) {
    return NextResponse.json({ phase: "no-matches" as Phase, items: [] });
  }

  // Map SnapFinder's Blob URLs back to gallery rows (join on exact URL).
  const urls = matched.map((m) => m.full_url);
  const rows = await prisma.guestPhoto.findMany({
    where: { url: { in: urls } },
    select: { id: true, url: true, type: true, caption: true, uploaderName: true }
  });
  const byUrl = new Map(rows.map((r) => [r.url, r]));

  // Preserve SnapFinder's best-distance ordering; drop any row that was deleted
  // between indexing and now.
  const items: GalleryItem[] = [];
  for (const m of matched) {
    const row = byUrl.get(m.full_url);
    if (!row) continue;
    items.push({
      id: row.id,
      url: row.url,
      type: row.type as "image" | "video",
      caption: row.caption,
      uploaderName: row.uploaderName,
      distance: m.best_distance
    });
  }

  const phase: Phase = items.length === 0 ? "no-matches" : "results";
  return NextResponse.json({ phase, items });
}
