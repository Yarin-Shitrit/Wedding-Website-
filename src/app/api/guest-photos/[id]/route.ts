import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteByUrl } from "@/lib/snapfinder";

// Admin-gated moderation: delete a guest-submitted photo/video. Removes the
// underlying Blob object and the DB row. Auth pattern mirrors
// /api/photos/upload (getSession() → 401 when absent).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const row = await prisma.guestPhoto.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort blob deletion. If it fails (e.g. already gone, token issue) we
  // still remove the DB row so the item leaves the gallery.
  try {
    await del(row.url);
  } catch (err) {
    console.error("guest-photos: blob delete failed", err);
  }

  // Best-effort: drop it from the face index too so it stops surfacing in
  // /find-my-photos matches. Never block the moderation delete on this.
  try {
    await deleteByUrl(row.url);
  } catch (err) {
    console.error("guest-photos: snapfinder delete failed", err);
  }

  await prisma.guestPhoto.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
