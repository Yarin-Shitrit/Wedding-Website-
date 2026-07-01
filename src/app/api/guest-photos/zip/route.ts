import { NextRequest } from "next/server";
// archiver v8 dropped the callable default export (`archiver("zip", …)`) in
// favor of named class exports. `new ZipArchive(opts)` is the v8 equivalent.
import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Public streaming ZIP of the guest gallery. The couple (or any guest) can grab
// all photos/videos, or a selected subset, in a single download. Streams so we
// never buffer the whole archive in memory.
//
// CAVEAT: very large, video-heavy galleries can approach the 300s function limit
// since each object is fetched and re-streamed sequentially. The client-side
// sequential per-item download is the always-works fallback for those cases.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  ids: z.array(z.string()).optional()
});

export async function POST(req: NextRequest) {
  let ids: string[] | undefined;
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (parsed.success) ids = parsed.data.ids;
  } catch {
    // No/invalid body → export everything.
  }

  const items = await prisma.guestPhoto.findMany({
    where: ids && ids.length > 0 ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: "asc" }
  });

  const archive = new ZipArchive({ zlib: { level: 0 } }); // media is already compressed

  // Populate the archive out-of-band; the Response streams bytes as they land.
  // On an empty result set we simply finalize immediately → a valid empty zip.
  (async () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const resp = await fetch(item.url);
        if (!resp.ok || !resp.body) continue;
        const ext = item.type === "video" ? "mp4" : "jpg"; // fallback extension
        const base = (item.pathname?.split("/").pop() || `${item.type}-${i}`).replace(
          /[^A-Za-z0-9._-]/g,
          "_"
        );
        const name = `${String(i + 1).padStart(3, "0")}-${
          base.includes(".") ? base : base + "." + ext
        }`;
        archive.append(Readable.fromWeb(resp.body as any), { name });
      } catch {
        /* skip unreachable item */
      }
    }
    archive.finalize();
  })();

  return new Response(Readable.toWeb(archive) as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="wedding-gallery.zip"',
      "Cache-Control": "no-store"
    }
  });
}
