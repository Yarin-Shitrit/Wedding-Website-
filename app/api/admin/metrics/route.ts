import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { computeMetrics } from "@/lib/metrics";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const metrics = await computeMetrics();
  return NextResponse.json({ ok: true, metrics });
}
