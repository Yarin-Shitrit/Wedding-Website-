// Server-only module: mints SnapFinder per-event HS256 JWTs.
//
// The `server-only` npm package is not a top-level dep in this repo, so we
// enforce server-only execution at runtime instead. The secret name lacks the
// `NEXT_PUBLIC_` prefix so Next.js will never inline it into the client bundle
// even if this module were transitively imported from a client boundary.
if (typeof window !== "undefined") {
  throw new Error("snapfinder.ts is server-only and must not run in the browser");
}

import { SignJWT } from "jose";

const ALG = "HS256";

/**
 * Mint an HS256 JWT scoped to a single SnapFinder event.
 *
 * Mirrors `snapfinder.auth.issue_event_token` (see auth.py) so the SnapFinder
 * backend's `verify_event_token` accepts the resulting credential. Claim
 * shape: `{ sub: <event_id>, scope: "event", iat, exp }`.
 *
 * @param eventId  UUID string of the event the token authorises.
 * @param ttlSec   Lifetime in seconds; pinned to `iat` for auditability.
 */
export async function issueEventToken(eventId: string, ttlSec: number): Promise<string> {
  const secret = process.env.SNAPFINDER_JWT_SECRET;
  if (!secret) {
    throw new Error("SNAPFINDER_JWT_SECRET is not set");
  }
  const key = new TextEncoder().encode(secret);
  const nowSec = Math.floor(Date.now() / 1000);

  return await new SignJWT({ scope: "event" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(eventId)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + ttlSec)
    .sign(key);
}
