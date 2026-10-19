import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { toSafeUser, jsonError } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);
    }
    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user?.password) {
      return jsonError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return jsonError("Invalid email or password", 401);
    }

    await db.account.updateMany({
      where: { user: { email }, provider: "credentials" },
      data: { tokensIssuedAt: new Date() },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    });

    const res = NextResponse.json({ user: toSafeUser(user) });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("[login]", e);
    return jsonError("Sign-in failed — please try again", 500);
  }
}
