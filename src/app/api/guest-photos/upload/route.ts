import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Vercel Blob client-upload token route (public). Issues short-lived client
// tokens so the BROWSER uploads bytes directly to Blob, bypassing Vercel's
// ~4.5MB serverless body limit — critical for videos. The DB row is created
// separately by the client via POST /api/guest-photos once the upload resolves.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm"
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: clientPayload ?? undefined
      }),
      // No-op: the DB row is created by the client via POST /api/guest-photos after
      // upload resolves. The onUploadCompleted webhook is unreachable on localhost,
      // so we deliberately do NOT create the row here (would double-create in prod).
      onUploadCompleted: async () => {}
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
