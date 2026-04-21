import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "wedding_admin";
const GUEST_COOKIE = "wedding_guest";
const ADMIN_MAX_AGE = 60 * 60 * 12; // 12h
const GUEST_MAX_AGE = 60 * 60 * 24 * 30; // 30d

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a 16+ char string");
  }
  return new TextEncoder().encode(secret);
}

type AdminPayload = { role: "admin" };
type GuestPayload = { role: "guest"; guestId: string; phone: string };

async function sign(payload: Record<string, unknown>, maxAgeSec: number) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getKey());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload as T;
  } catch {
    return null;
  }
}

export async function createAdminSession() {
  const token = await sign({ role: "admin" }, ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verify<AdminPayload>(token);
}

export async function createGuestSession(guestId: string, phone: string) {
  const token = await sign({ role: "guest", guestId, phone }, GUEST_MAX_AGE);
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
}

export async function destroyGuestSession() {
  (await cookies()).delete(GUEST_COOKIE);
}

export async function getGuestSession(): Promise<GuestPayload | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return verify<GuestPayload>(token);
}

export const COOKIE_NAMES = { admin: ADMIN_COOKIE, guest: GUEST_COOKIE };

// Edge-runtime safe verification (for middleware). Uses raw token string.
export async function verifyAdminToken(token: string | undefined) {
  return verify<AdminPayload>(token);
}
