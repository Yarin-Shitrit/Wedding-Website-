import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const CreateGallery = z.object({
  src: z.string().url().optional().nullable(),
  alt: z.string().min(1),
  ratio: z.string().default("1/1"),
  span: z.coerce.number().int().min(1).max(2).default(1),
  order: z.coerce.number().int().min(0).default(0)
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.galleryItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = CreateGallery.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const item = await prisma.galleryItem.create({ data: parsed.data });
  return NextResponse.json(item, { status: 201 });
}
