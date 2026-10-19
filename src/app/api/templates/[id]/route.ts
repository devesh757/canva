import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { getUser, mustAuth } from "@/lib/api-helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Returns the full template blueprint (with canvas JSON payload).
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const { id } = await ctx.params;
    const template = await db.template.findUnique({ where: { id } });
    if (!template) return jsonError("Template not found", 404);
    return NextResponse.json({ template });
  } catch {
    return jsonError("Could not load template", 500);
  }
}
