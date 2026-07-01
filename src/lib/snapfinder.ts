// Server-only client for the SnapFinder face-match backend.
//
// SnapFinder is a separate service (deployed on Railway) that indexes the
// guest gallery for face recognition. This module is the single boundary that
// holds its URL + credentials: it mints per-event JWTs, ingests gallery photos
// by URL, propagates moderation deletes, and runs selfie matches. Nothing here
// is ever sent to the browser — the /find-my-photos page proxies through a Next
// route so the event token and SnapFinder URL stay server-side.
//
// The secret name lacks the NEXT_PUBLIC_ prefix so Next never inlines it into
// the client bundle even if this module were transitively imported client-side;
// we also hard-fail if it somehow runs in a browser.
if (typeof window !== "undefined") {
  throw new Error("snapfinder.ts is server-only and must not run in the browser");
}

import { SignJWT } from "jose";

const ALG = "HS256";
const DEFAULT_TTL_SECONDS = 3600;

export interface SnapfinderConfig {
  apiUrl: string; // base URL of the SnapFinder API, no trailing slash
  eventId: string; // the wedding's SnapFinder event UUID
  jwtSecret: string; // must equal SnapFinder's JWT_SECRET
  ttlSeconds: number;
}

/**
 * Read + validate SnapFinder env. Returns null when unconfigured so callers
 * (ingest / delete) can gracefully no-op — the gallery must keep working even
 * if face recognition isn't wired up yet.
 */
export function getSnapfinderConfig(): SnapfinderConfig | null {
  const apiUrl = process.env.SNAPFINDER_API_URL?.trim().replace(/\/+$/, "");
  const eventId = process.env.SNAPFINDER_EVENT_ID?.trim();
  const jwtSecret = process.env.SNAPFINDER_JWT_SECRET?.trim();
  if (!apiUrl || !eventId || !jwtSecret) return null;
  const ttlRaw = Number(process.env.SNAPFINDER_EVENT_TOKEN_TTL);
  const ttlSeconds = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : DEFAULT_TTL_SECONDS;
  return { apiUrl, eventId, jwtSecret, ttlSeconds };
}

/**
 * Mint an HS256 JWT scoped to a single SnapFinder event. Claim shape mirrors
 * `snapfinder.auth.issue_event_token`: `{ sub: <event_id>, scope: "event",
 * iat, exp }`, so the backend's `verify_event_token` accepts it.
 */
export async function issueEventToken(cfg: SnapfinderConfig): Promise<string> {
  const key = new TextEncoder().encode(cfg.jwtSecret);
  const nowSec = Math.floor(Date.now() / 1000);
  return await new SignJWT({ scope: "event" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(cfg.eventId)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + cfg.ttlSeconds)
    .sign(key);
}

// ---- Match types (mirror SnapFinder's schemas/match.py) -------------------

export interface MatchedFace {
  face_id: string;
  bbox: [number, number, number, number];
  distance: number;
}
export interface MatchedPhoto {
  photo_id: string;
  best_distance: number;
  faces: MatchedFace[];
  thumb_url: string | null;
  full_url: string; // for URL-native rows this is the exact Vercel Blob URL
}
export interface MatchResponse {
  query_faces_detected: number;
  results: MatchedPhoto[];
}

export type MatchOutcome =
  | { ok: true; data: MatchResponse }
  | { ok: false; kind: "no-face" | "not-configured" | "error" };

const INGEST_CHUNK = 100; // SnapFinder caps a by-url batch at 200

/**
 * Register gallery photos with SnapFinder by URL (idempotent server-side).
 * Returns aggregate counts. Throws on network / non-OK responses so callers
 * decide whether to swallow (best-effort on upload) or surface (backfill).
 */
export async function ingestUrls(
  urls: string[]
): Promise<{ queued: number; skipped: number }> {
  const cfg = getSnapfinderConfig();
  if (!cfg || urls.length === 0) return { queued: 0, skipped: 0 };
  const token = await issueEventToken(cfg);

  let queued = 0;
  let skipped = 0;
  for (let i = 0; i < urls.length; i += INGEST_CHUNK) {
    const chunk = urls.slice(i, i + INGEST_CHUNK);
    const resp = await fetch(`${cfg.apiUrl}/events/${cfg.eventId}/photos/by-url`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ urls: chunk }),
      cache: "no-store"
    });
    if (!resp.ok) {
      throw new Error(`snapfinder ingest failed: ${resp.status}`);
    }
    const data = (await resp.json()) as { queued: string[]; skipped: number };
    queued += data.queued?.length ?? 0;
    skipped += data.skipped ?? 0;
  }
  return { queued, skipped };
}

/**
 * Remove a photo from the face index (e.g. after admin moderation) so it stops
 * surfacing in matches. Best-effort: a 404 (never indexed) is not an error.
 */
export async function deleteByUrl(url: string): Promise<void> {
  const cfg = getSnapfinderConfig();
  if (!cfg) return;
  const token = await issueEventToken(cfg);
  const resp = await fetch(`${cfg.apiUrl}/events/${cfg.eventId}/photos/by-url`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ url }),
    cache: "no-store"
  });
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`snapfinder delete failed: ${resp.status}`);
  }
}

/**
 * Run a selfie match. Forwards the selfie bytes to SnapFinder (which processes
 * them in RAM and discards them) and returns the matched photos. Distinguishes
 * "no face detected" (422) so the UI can give specific guidance.
 */
export async function matchSelfies(files: File[]): Promise<MatchOutcome> {
  const cfg = getSnapfinderConfig();
  if (!cfg || files.length === 0) return { ok: false, kind: "not-configured" };
  const token = await issueEventToken(cfg);

  const form = new FormData();
  for (const f of files) form.append("files", f, f.name || "selfie.jpg");

  let resp: Response;
  try {
    resp = await fetch(`${cfg.apiUrl}/events/${cfg.eventId}/match`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store"
    });
  } catch {
    return { ok: false, kind: "error" };
  }

  if (resp.status === 422) return { ok: false, kind: "no-face" };
  if (!resp.ok) return { ok: false, kind: "error" };

  const data = (await resp.json()) as MatchResponse;
  return { ok: true, data };
}
