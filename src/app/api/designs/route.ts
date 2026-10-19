import { NextResponse } from "next/server";
import { getUser, mustAuth, jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { designCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

// List the current user's designs (with optional search over titles).
export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase();

    const designs = await db.design.findMany({
      where: {
        userId: user!.id,
        ...(q
          ? { title: { contains: q } }
          : {}),
      },
      select: {
        id: true,
        title: true,
        category: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 60,
    });

    return NextResponse.json({ designs });
  } catch {
    return jsonError("Could not load designs", 500);
  }
}

// Create a design — either blank or cloned from a template blueprint.
export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    const guard = mustAuth(user);
    if (guard) return guard;

    const body = await req.json();
    const parsed = designCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid design data", 422);
    }
    const { title, category, width, height, fromTemplateId } = parsed.data;

    let jsonPayload = "{}";
    let titleFinal = title;
    let widthFinal = width;
    let heightFinal = height;
    let categoryFinal = category;

    if (fromTemplateId) {
      const template = await db.template.findUnique({
        where: { id: fromTemplateId },
      });
      if (!template) return jsonError("Template not found", 404);
      jsonPayload = template.jsonPayload;
      titleFinal = title === "Untitled design" ? template.title : title;
      widthFinal = template.width;
      heightFinal = template.height;
      categoryFinal = template.category;
    }

    const design = await db.design.create({
      data: {
        title: titleFinal,
        category: categoryFinal,
        width: widthFinal,
        height: heightFinal,
        jsonPayload,
        userId: user!.id,
      },
    });

    return NextResponse.json({ design }, { status: 201 });
  } catch (e) {
    console.error("[designs:create]", e);
    return jsonError("Could not create design", 500);
  }
}
