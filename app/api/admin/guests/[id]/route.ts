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

const PatchSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  side: z.enum(["BRIDE", "GROOM", "BOTH"]).optional(),
  relation: z.string().nullable().optional(),
  invitedCount: z.number().int().min(1).max(20).optional(),
  rsvpStatus: z.enum(["ATTENDING", "DECLINED", "PENDING", "MAYBE"]).optional(),
  attendingCount: z.number().int().min(0).max(20).nullable().optional(),
  dietary: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tableId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.phone === "string") {
    const normalized = normalizePhone(parsed.data.phone);
    if (!normalized) {
      return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
    }
    data.phone = normalized;
  }
  if (parsed.data.tableId === "") data.tableId = null;

  const guest = await prisma.guest.update({ where: { id }, data });
  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.guest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
