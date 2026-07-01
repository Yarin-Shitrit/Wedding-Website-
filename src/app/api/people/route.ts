import { NextResponse } from "next/server";
import { listPeople } from "@/lib/snapfinder";

// Public: the clustered "people" for the browse-by-face grid. Each entry points
// at the face-crop image proxy (below) so the browser never sees the event
// token or the SnapFinder URL.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const people = await listPeople();
    return NextResponse.json({
      people: people.map((p) => ({
        clusterId: p.cluster_id,
        size: p.size,
        faceUrl: `/api/people/face/${p.representative_face_id}`
      }))
    });
  } catch {
    // SnapFinder down / not clustered yet → empty grid, selfie flow still works.
    return NextResponse.json({ people: [] });
  }
}
