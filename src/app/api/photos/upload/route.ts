import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Admin-gated photo upload. Stores the file bytes in Vercel Blob and creates a
// curated GalleryItem pointing at the public Blob URL, so admin uploads appear
// in the homepage gallery. Replaces the previous direct-to-SnapFinder path.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — matches the admin uploader UI
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

function safeFilename(raw: string | null | undefined): string {
  if (!raw) return "photo.jpg";
  const base = raw.split(/[\\/]/).pop() ?? "photo.jpg";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return cleaned || "photo.jpg";
}

function altFromFilename(name: string): string {
  // Drop the extension and tidy separators for a human-ish alt text.
  const base = name.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ").trim();
  return base || "תמונה";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Accept either `file` or the legacy `files` field name.
  const file = form.get("file") ?? form.get("files");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const looksLikeHeic = /\.(heic|heif)$/i.test(file.name);
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type (${file.type})` },
      { status: 400 }
    );
  }
  if (!file.type && !looksLikeHeic) {
    return NextResponse.json({ error: "Unknown file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 25 MB limit" },
      { status: 400 }
    );
  }

  let blob;
  try {
    blob = await put(safeFilename(file.name), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined
    });
  } catch (err) {
    // Most commonly a missing/invalid BLOB_READ_WRITE_TOKEN.
    console.error("photos/upload: blob upload failed", err);
    return NextResponse.json(
      { error: "Upload failed — Blob storage is not configured." },
      { status: 500 }
    );
  }

  // Append to the end of the gallery. A minor race under parallel uploads only
  // means two items briefly share an order value, which is harmless.
  const last = await prisma.galleryItem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true }
  });
  const order = (last?.order ?? -1) + 1;

  const item = await prisma.galleryItem.create({
    data: {
      src: blob.url,
      alt: altFromFilename(file.name),
      order
    }
  });

  return NextResponse.json(item, { status: 201 });
}
