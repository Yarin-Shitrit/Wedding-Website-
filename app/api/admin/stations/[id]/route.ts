import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { validateDataUrl } from "@/lib/image";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const PatchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(600).optional(),
  dataUrl: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
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
  if (parsed.data.dataUrl) {
    const valid = validateDataUrl(parsed.data.dataUrl);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "bad_image" }, { status: 400 });
    }
  }
  const station = await prisma.station.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, station });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.station.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
