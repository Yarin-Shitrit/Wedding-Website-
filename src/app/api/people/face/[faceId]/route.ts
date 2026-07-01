import { NextRequest } from "next/server";
import { getFaceCrop } from "@/lib/snapfinder";

// Image proxy for representative face crops. Holds the event token server-side
// and streams the JPEG from SnapFinder so the browser can use it as a plain
// <img src>. Cached hard — a representative face crop is stable.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { faceId: string } }
) {
  const crop = await getFaceCrop(params.faceId);
  if (!crop) {
    return new Response("not found", { status: 404 });
  }
  return new Response(crop.body, {
    status: 200,
    headers: {
      "content-type": crop.contentType,
      "cache-control": "public, max-age=86400, immutable"
    }
  });
}
