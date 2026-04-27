import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const UpdateGallery = z.object({
  src: z.string().url().nullable().optional(),
  alt: z.string().min(1).optional(),
  ratio: z.string().optional(),
  span: z.number().int().min(1).max(2).optional(),
  order: z.number().int().min(0).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = UpdateGallery.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const item = await prisma.galleryItem.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.galleryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
