import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const CreateMoment = z.object({
  chapter: z.string().min(1).max(8).default("I"),
  year: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const moments = await prisma.moment.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(moments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = CreateMoment.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const moment = await prisma.moment.create({ data: parsed.data });
  return NextResponse.json(moment, { status: 201 });
}
