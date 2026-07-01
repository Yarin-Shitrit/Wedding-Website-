import { NextRequest } from "next/server";

// Streams a presigned MinIO/S3 photo back to the browser with
// Content-Disposition: attachment so the browser actually downloads
// instead of navigating-and-rendering. Cross-origin presigned URLs from
// MinIO render inline by default; this proxy is the simplest fix.
//
// Force Node runtime — Edge runtime's fetch is missing some streaming
// niceties (e.g. duplex), and we want to be able to stream large photos
// without buffering them server-side.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allowlist of hosts the proxy will fetch from. Prevents this endpoint
// from being trivially turned into an open redirect / SSRF gadget.
function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const env of [
    process.env.NEXT_PUBLIC_SNAPFINDER_API_URL,
    process.env.SNAPFINDER_PUBLIC_S3_URL,
    // Sensible localhost defaults for dev so the proxy works out of the box.
    "http://localhost:9000",
    "http://localhost:8000"
  ]) {
    if (!env) continue;
    try {
      hosts.add(new URL(env).host);
    } catch {
      /* ignore malformed env */
    }
  }
  return hosts;
}

function safeFilename(raw: string | null): string {
  // Strip path components, keep only safe characters, clamp length.
  if (!raw) return "photo.jpg";
  const base = raw.split(/[\\/]/).pop() ?? "photo.jpg";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return cleaned || "photo.jpg";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = safeFilename(req.nextUrl.searchParams.get("name"));
  if (!url) {
    return new Response("missing 'url' query param", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("unsupported protocol", { status: 400 });
  }
  if (!allowedHosts().has(target.host)) {
    return new Response(`host not allowed: ${target.host}`, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { method: "GET" });
  } catch {
    return new Response("upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(`upstream returned ${upstream.status}`, {
      status: 502
    });
  }

  // Pass through bytes; override the disposition so the browser saves the
  // file instead of rendering it inline.
  const headers = new Headers();
  const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
  headers.set("Content-Type", ct);
  const cl = upstream.headers.get("content-length");
  if (cl) headers.set("Content-Length", cl);
  headers.set("Content-Disposition", `attachment; filename="${name}"`);
  // Avoid intermediate caches keying on the URL — presigned URLs expire.
  headers.set("Cache-Control", "private, no-store");

  return new Response(upstream.body, { status: 200, headers });
}
