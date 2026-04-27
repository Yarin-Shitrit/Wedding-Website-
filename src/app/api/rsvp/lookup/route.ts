import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function digits(p: string | null) {
  return (p || "").replace(/[^0-9]/g, "");
}

// Build the set of plausible stored-phone formats for an input. Handles IL.
function phoneVariants(input: string): string[] {
  const d = digits(input);
  if (!d) return [];
  const local = d.startsWith("972")
    ? d.slice(3)
    : d.startsWith("0")
      ? d.slice(1)
      : d;
  return [
    `+972${local}`,
    `972${local}`,
    `0${local}`,
    local,
    d
  ];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const phoneInput = url.searchParams.get("phone");
  const token = url.searchParams.get("token") ?? null;

  if (!phoneInput && !token) {
    return NextResponse.json({ error: "phone or token required" }, { status: 400 });
  }
  if (phoneInput && digits(phoneInput).length < 9) {
    return NextResponse.json({ error: "phone too short" }, { status: 400 });
  }

  const guest = token
    ? await prisma.guest.findUnique({ where: { rsvpToken: token } })
    : await prisma.guest.findFirst({
        where: { phone: { in: phoneVariants(phoneInput!) } }
      });

  if (!guest) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    guest: {
      id: guest.id,
      token: guest.rsvpToken,
      firstName: guest.firstName,
      lastName: guest.lastName,
      name: [guest.firstName, guest.lastName].filter(Boolean).join(" "),
      phone: guest.phone,
      seatsInvited: guest.seatsInvited,
      seatsConfirmed: guest.seatsConfirmed,
      status: guest.status,
      dietary: guest.dietary,
      notes: guest.notes,
      respondedAt: guest.respondedAt
    }
  });
}
