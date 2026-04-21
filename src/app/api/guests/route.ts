import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const CreateGuest = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  side: z.enum(["BRIDE", "GROOM", "SHARED"]).default("SHARED"),
  group: z.string().optional().nullable(),
  seatsInvited: z.coerce.number().int().min(1).default(1),
  tableId: z.string().optional().nullable()
});

async function requireAdmin() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
    include: { table: { select: { id: true, name: true } } }
  });
  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const body = await req.json();
  const parsed = CreateGuest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const guest = await prisma.guest.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      phone: data.phone || null,
      email: data.email || null,
      side: data.side,
      group: data.group ?? null,
      seatsInvited: data.seatsInvited,
      tableId: data.tableId ?? null
    }
  });
  return NextResponse.json(guest, { status: 201 });
}
