import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

// RSC-safe session reader (no request object needed).
export async function requireUser(): Promise<User> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session?.payload.userId) {
    redirect("/signin?next=/dashboard");
  }
  const user = await db.user.findUnique({
    where: { id: session.payload.userId },
  });
  if (!user) redirect("/signin");
  return user;
}
