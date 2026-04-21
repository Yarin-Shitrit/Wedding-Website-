import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

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
  const guests = await prisma.guest.findMany({
    include: { table: { select: { id: true, label: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json({ ok: true, guests });
}

const CreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(3),
  side: z.enum(["BRIDE", "GROOM", "BOTH"]),
  relation: z.string().optional().nullable(),
  invitedCount: z.number().int().min(1).max(20),
  tableId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  const guest = await prisma.guest.create({
    data: {
      ...parsed.data,
      phone,
      relation: parsed.data.relation ?? null,
      tableId: parsed.data.tableId || null,
    },
  });
  return NextResponse.json({ ok: true, guest });
}
