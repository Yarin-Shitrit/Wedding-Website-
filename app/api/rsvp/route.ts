import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGuestSession } from "@/lib/auth";

export async function GET() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const guest = await prisma.guest.findUnique({
    where: { id: session.guestId },
    include: { table: true },
  });
  if (!guest) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, guest });
}

const PatchSchema = z.object({
  rsvpStatus: z.enum(["ATTENDING", "DECLINED", "MAYBE", "PENDING"]),
  attendingCount: z.number().int().min(0).max(20).nullable().optional(),
  dietary: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const current = await prisma.guest.findUnique({ where: { id: session.guestId } });
  if (!current) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const data = parsed.data;
  const bounded =
    data.attendingCount != null
      ? Math.min(data.attendingCount, current.invitedCount)
      : data.rsvpStatus === "ATTENDING"
      ? current.invitedCount
      : null;

  const updated = await prisma.guest.update({
    where: { id: session.guestId },
    data: {
      rsvpStatus: data.rsvpStatus,
      attendingCount: bounded,
      dietary: data.dietary ?? null,
      notes: data.notes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: current.phone ?? current.id,
      action: "rsvp.update",
      payload: { status: data.rsvpStatus, count: bounded },
    },
  });

  return NextResponse.json({ ok: true, guest: updated });
}
