import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { validateDataUrl } from "@/lib/image";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const photos = await prisma.photo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, photos });
}

const PostSchema = z.object({
  dataUrl: z.string().min(1),
  caption: z.string().max(240).optional().nullable(),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const json = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const dataUrl = validateDataUrl(parsed.data.dataUrl);
  if (!dataUrl) {
    return NextResponse.json({ ok: false, error: "bad_image" }, { status: 400 });
  }
  const last = await prisma.photo.findFirst({ orderBy: { sortOrder: "desc" } });
  const photo = await prisma.photo.create({
    data: {
      dataUrl,
      caption: parsed.data.caption ?? null,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    },
  });
  return NextResponse.json({ ok: true, photo });
}
