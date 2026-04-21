import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const CreateTable = z.object({
  name: z.string().min(1),
  capacity: z.coerce.number().int().min(1).default(10),
  notes: z.string().optional().nullable()
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tables = await prisma.table.findMany({
    include: { _count: { select: { guests: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = CreateTable.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const table = await prisma.table.create({ data: parsed.data });
    return NextResponse.json(table, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A table with that name already exists" }, { status: 409 });
  }
}
