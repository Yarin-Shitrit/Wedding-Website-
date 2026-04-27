import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RsvpInput = z.object({
  token: z.string().optional(),
  phone: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  status: z.enum(["PENDING", "ATTENDING", "DECLINED", "MAYBE"]),
  seatsConfirmed: z.coerce.number().int().min(0).default(0),
  dietary: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

function digits(p: string) {
  return p.replace(/[^0-9]/g, "");
}

function phoneVariants(input: string): string[] {
  const d = digits(input);
  if (!d) return [];
  const local = d.startsWith("972")
    ? d.slice(3)
    : d.startsWith("0")
      ? d.slice(1)
      : d;
  return [`+972${local}`, `972${local}`, `0${local}`, local, d];
}

export async function POST(req: NextRequest) {
  const parsed = RsvpInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  const data = parsed.data;

  let guest = null;
  if (data.token) {
    guest = await prisma.guest.findUnique({ where: { rsvpToken: data.token } });
  }
  if (!guest) {
    guest = await prisma.guest.findFirst({
      where: { phone: { in: phoneVariants(data.phone) } }
    });
  }

  const maxSeats = guest?.seatsInvited ?? Math.max(1, data.seatsConfirmed);
  const seats = Math.min(data.seatsConfirmed, maxSeats);

  if (guest) {
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName ?? guest.lastName,
        // Keep the originally-stored phone format unchanged unless caller passed a token.
        phone: guest.phone ?? data.phone,
        status: data.status,
        seatsConfirmed: data.status === "ATTENDING" ? seats : 0,
        dietary: data.dietary ?? null,
        notes: data.notes ?? null,
        respondedAt: new Date()
      }
    });
  } else {
    await prisma.guest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        phone: data.phone,
        status: data.status,
        seatsInvited: Math.max(1, seats || 1),
        seatsConfirmed: data.status === "ATTENDING" ? Math.max(1, seats || 1) : 0,
        dietary: data.dietary ?? null,
        notes: data.notes ?? null,
        respondedAt: new Date()
      }
    });
  }

  return NextResponse.json({ ok: true });
}
