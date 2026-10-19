import { SignJWT, jwtVerify } from "jose";
import type { JWTVerifyResult } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-please-change-in-production-32chars"
);
const EXPIRES = Number(process.env.AUTH_EXPIRES ?? 60 * 60 * 24 * 30);

export const SESSION_COOKIE = "canvas_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  plan: string;
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("canva-clone")
    .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRES)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<JWTVerifyResult<SessionPayload> | null> {
  try {
    return await jwtVerify<SessionPayload>(token, secret, {
      issuer: "canva-clone",
    });
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: EXPIRES,
  secure: process.env.NODE_ENV === "production",
};
