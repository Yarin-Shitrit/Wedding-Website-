import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

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
  const blocks = await prisma.contentBlock.findMany();
  return NextResponse.json({ ok: true, blocks });
}

const PatchSchema = z.object({
  key: z.string().min(1),
  valueJson: z.any(),
});

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const block = await prisma.contentBlock.upsert({
    where: { key: parsed.data.key },
    update: { valueJson: parsed.data.valueJson },
    create: { key: parsed.data.key, valueJson: parsed.data.valueJson },
  });
  return NextResponse.json({ ok: true, block });
}
