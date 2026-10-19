import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";

export const runtime = "nodejs";

// Public template gallery (used by dashboard + editor drawer).
// jsonPayload is included for client-side SVG preview rendering.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const templates = await db.template.findMany({
      where: category && category !== "all" ? { category } : undefined,
      select: {
        id: true,
        title: true,
        category: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        isPro: true,
        meta: true,
        jsonPayload: true,
      },
      orderBy: { createdAt: "asc" },
      take: 60,
    });
    return NextResponse.json({ templates });
  } catch {
    return jsonError("Could not load templates", 500);
  }
}
