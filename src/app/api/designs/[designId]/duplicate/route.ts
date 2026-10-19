import { NextResponse } from "next/server";
import { getUser, mustAuth, jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ designId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const { designId } = await ctx.params;
    const design = await db.design.findFirst({
      where: { id: designId, userId: user!.id },
    });
    if (!design) return jsonError("Design not found", 404);

    const copy = await db.design.create({
      data: {
        userId: user!.id,
        title: `Copy of ${design.title}`,
        category: design.category,
        width: design.width,
        height: design.height,
        thumbnailUrl: design.thumbnailUrl,
        jsonPayload: design.jsonPayload,
      },
    });

    return NextResponse.json({ design: copy }, { status: 201 });
  } catch {
    return jsonError("Duplicate failed", 500);
  }
}
