import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

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
  const tables = await prisma.table.findMany({
    include: { guests: true },
    orderBy: { label: "asc" },
  });
  return NextResponse.json({ ok: true, tables });
}

const CreateSchema = z.object({
  label: z.string().min(1),
  capacity: z.number().int().min(1).max(50).default(10),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const table = await prisma.table.create({ data: parsed.data });
  return NextResponse.json({ ok: true, table });
}
