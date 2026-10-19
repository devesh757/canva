import { NextResponse } from "next/server";
import { getUser, mustAuth, jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { designSaveSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ designId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const { designId } = await ctx.params;
    const design = await db.design.findFirst({
      where: { id: designId, userId: user!.id },
    });
    if (!design) return jsonError("Design not found", 404);

    return NextResponse.json({ design });
  } catch {
    return jsonError("Could not load design", 500);
  }
}

// Autosave endpoint — persists title / layer JSON / compressed thumbnail.
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const { designId } = await ctx.params;
    const body = await req.json();
    const parsed = designSaveSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid save payload", 422);

    const design = await db.design.updateMany({
      where: { id: designId, userId: user!.id },
      data: parsed.data,
    });

    if (design.count === 0) return jsonError("Design not found", 404);
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[design:save]", e);
    return jsonError("Save failed — your work is still on canvas", 500);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const { designId } = await ctx.params;
    const deleted = await db.design.deleteMany({
      where: { id: designId, userId: user!.id },
    });
    if (deleted.count === 0) return jsonError("Design not found", 404);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Delete failed", 500);
  }
}
