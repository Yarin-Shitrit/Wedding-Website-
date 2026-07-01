import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Public, un-authed guest photo/video gallery. In the gallery-first flow the
// BROWSER uploads bytes directly to Vercel Blob (see /api/guest-photos/upload),
// then POSTs the resulting metadata here to record a GuestPhoto row. Mirrors the
// public-write shape of /api/rsvp (no getSession()) and the Hebrew error tone of
// the previous direct-upload route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The public Blob host suffix. Since this endpoint is public and un-authed, we
// only accept URLs that live on Vercel Blob storage to block arbitrary-URL
// injection (someone recording a bogus GuestPhoto pointing anywhere).
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

// New POST contract: metadata recorded AFTER the client-upload resolves.
const RecordBody = z.object({
  url: z.string().url(),
  pathname: z.string().optional(),
  type: z.enum(["image", "video"]),
  caption: z.string().trim().max(140).optional(),
  uploaderName: z.string().trim().max(60).optional(),
  token: z.string().trim().optional()
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const parsed = RecordBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { url, pathname, type, caption, uploaderName, token } = parsed.data;

  // SECURITY GUARD: reject anything not hosted on Vercel Blob storage.
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return NextResponse.json({ error: "כתובת לא תקינה." }, { status: 400 });
  }
  if (!host.endsWith(BLOB_HOST_SUFFIX)) {
    return NextResponse.json({ error: "מקור הקובץ אינו מורשה." }, { status: 400 });
  }

  // Optional personalization: resolve the guest from their rsvpToken.
  let guestId: string | null = null;
  let resolvedName = uploaderName?.trim() || null;
  if (token) {
    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: token },
      select: { id: true, firstName: true }
    });
    if (guest) {
      guestId = guest.id;
      if (!resolvedName) resolvedName = guest.firstName;
    }
  }

  const record = await prisma.guestPhoto.create({
    data: {
      url,
      pathname: pathname ?? null,
      type,
      caption: caption?.trim() || null,
      uploaderName: resolvedName,
      guestId
    }
  });

  return NextResponse.json(record, { status: 201 });
}

export async function GET() {
  const photos = await prisma.guestPhoto.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(photos);
}
