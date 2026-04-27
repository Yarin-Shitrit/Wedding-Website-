import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const UpdateMoment = z.object({
  chapter: z.string().min(1).max(8).optional(),
  year: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  order: z.number().int().min(0).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = UpdateMoment.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const moment = await prisma.moment.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(moment);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.moment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
