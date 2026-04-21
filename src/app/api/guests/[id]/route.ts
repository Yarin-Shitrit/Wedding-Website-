import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const UpdateGuest = z.object({
  firstName: z.string().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  side: z.enum(["BRIDE", "GROOM", "SHARED"]).optional(),
  group: z.string().nullable().optional(),
  seatsInvited: z.number().int().min(0).optional(),
  seatsConfirmed: z.number().int().min(0).optional(),
  status: z.enum(["PENDING", "ATTENDING", "DECLINED", "MAYBE"]).optional(),
  dietary: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tableId: z.string().nullable().optional()
});

async function requireAdmin() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const body = await req.json();
  const parsed = UpdateGuest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const guest = await prisma.guest.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(guest);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  await prisma.guest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
