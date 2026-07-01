import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPersonPhotos } from "@/lib/snapfinder";

// Public: every gallery photo a clustered person appears in. Mirrors
// /api/find-my-photos — maps SnapFinder's Blob URLs back to GuestPhoto rows so
// the client renders real gallery items (with working downloads).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  uploaderName: string | null;
  distance: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { clusterId: string } }
) {
  const clusterId = Number(params.clusterId);
  if (!Number.isInteger(clusterId)) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  let matched;
  try {
    matched = await getPersonPhotos(clusterId);
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }

  const urls = matched.map((m) => m.full_url);
  const rows = await prisma.guestPhoto.findMany({
    where: { url: { in: urls } },
    select: { id: true, url: true, type: true, caption: true, uploaderName: true }
  });
  const byUrl = new Map(rows.map((r) => [r.url, r]));

  const items: GalleryItem[] = [];
  for (const m of matched) {
    const row = byUrl.get(m.full_url);
    if (!row) continue; // dropped if moderated/deleted since indexing
    items.push({
      id: row.id,
      url: row.url,
      type: row.type as "image" | "video",
      caption: row.caption,
      uploaderName: row.uploaderName,
      distance: 0
    });
  }

  return NextResponse.json({ items });
}
