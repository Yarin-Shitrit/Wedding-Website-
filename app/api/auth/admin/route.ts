import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, destroyAdminSession } from "@/lib/auth";

const BodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (parsed.data.password !== expected) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
