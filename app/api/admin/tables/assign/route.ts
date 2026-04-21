import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const BodySchema = z.object({
  guestId: z.string().min(1),
  tableId: z.string().nullable(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const guest = await prisma.guest.update({
    where: { id: parsed.data.guestId },
    data: { tableId: parsed.data.tableId },
    include: { table: { select: { id: true, label: true } } },
  });
  return NextResponse.json({ ok: true, guest });
}
