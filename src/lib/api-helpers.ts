import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "password">;

export function toSafeUser(user: User): SafeUser {
  const { password: _pw, ...safe } = user;
  void _pw;
  return safe;
}

// Extract the session user from request cookies or null.
export async function getUser(req: Request): Promise<SafeUser | null> {
  try {
    const rawCookie = req.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));

    const token = rawCookie?.split("=")[1]
      ? decodeURIComponent(rawCookie.split("=")[1])
      : null;

    if (!token) return null;

    const result = await verifySessionToken(token);
    if (!result?.payload.userId) return null;

    const user = await db.user.findUnique({
      where: { id: result.payload.userId },
    });
    return user ? toSafeUser(user) : null;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function mustAuth(
  user: SafeUser | null
): NextResponse | null {
  return user
    ? null
    : jsonError("Unauthorized — sign in to continue", 401);
}
