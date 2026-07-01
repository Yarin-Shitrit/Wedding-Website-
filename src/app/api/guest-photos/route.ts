import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Public, un-authed guest photo gallery. Guests POST a photo from /share;
// the bytes go to Vercel Blob and a GuestPhoto row records the public URL.
// Mirrors the public-write shape of /api/rsvp (no getSession()), plus the
// nodejs runtime + filename sanitization conventions of /api/photos/download.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

// Validate the optional text fields that ride alongside the file.
const TextFields = z.object({
  caption: z.string().trim().max(140).optional(),
  uploaderName: z.string().trim().max(60).optional(),
  token: z.string().trim().optional()
});

function safeFilename(raw: string | null | undefined): string {
  // Strip path components, keep only safe characters, clamp length.
  if (!raw) return "photo.jpg";
  const base = raw.split(/[\\/]/).pop() ?? "photo.jpg";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return cleaned || "photo.jpg";
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "לא נבחרה תמונה." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "פורמט לא נתמך. אפשר JPEG, PNG, WebP או HEIC." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "התמונה גדולה מדי (עד ‎15MB)." },
      { status: 400 }
    );
  }

  const parsed = TextFields.safeParse({
    caption: form.get("caption") ?? undefined,
    uploaderName: form.get("uploaderName") ?? undefined,
    token: form.get("token") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { caption, uploaderName, token } = parsed.data;

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

  let blob;
  try {
    blob = await put(safeFilename(file.name), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type
    });
  } catch (err) {
    // Most commonly a missing/invalid BLOB_READ_WRITE_TOKEN.
    console.error("guest-photos: blob upload failed", err);
    return NextResponse.json(
      { error: "העלאת התמונה נכשלה. נסו שוב מאוחר יותר." },
      { status: 500 }
    );
  }

  const record = await prisma.guestPhoto.create({
    data: {
      url: blob.url,
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
