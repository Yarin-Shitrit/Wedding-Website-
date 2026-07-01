import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { triggerClustering } from "@/lib/snapfinder";

// Admin-only: enqueue a (re)clustering pass so the people grid reflects newly
// indexed photos. Run this after uploads have finished processing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await triggerClustering();
  return NextResponse.json({ ok: true });
}
