import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { createGuestSession } from "@/lib/auth";

const BodySchema = z.object({ phone: z.string().min(3) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { phone } });
  if (!guest) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await createGuestSession(guest.id, phone);
  return NextResponse.json({ ok: true, phone });
}
