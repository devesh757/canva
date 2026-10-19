import type * as F from "fabric";
import { uid } from "@/lib/utils";
export type FabricMod = typeof F;
export type FabricObj = F.FabricObject;
export type Canvas2 = F.Canvas;

let fabricPromise: Promise<FabricMod> | null = null;

// Lazily load fabric once (client-only). Avoids SSR/ES module pitfalls.
export function getFabric(): Promise<FabricMod> {
  if (!fabricPromise) {
    fabricPromise = import("fabric");
  }
  return fabricPromise;
}

export interface CanvasSnapshot {
  background: string | null;
  objects: Record<string, unknown>[];
  version: string;
}

export function parseBackground(json: string): string | null {
  try {
    const parsed = JSON.parse(json) as { background?: string };
    if (typeof parsed.background === "string") return parsed.background;
  } catch {
    /* noop */
  }
  return null;
}

export function serialize(
  canvas: Canvas2,
  version: string
): string {
  // toObject accepts the propertiesToInclude list; toJSON() is 0-arg in v6 types
  const json = canvas.toObject(["data"]) as Record<string, unknown>;
  json.version = version;
  json.background = canvas.backgroundColor ?? "#ffffff";
  return JSON.stringify(json);
}

export async function loadSnapshot(
  fabric: FabricMod,
  canvas: Canvas2,
  json: string
) {
  await canvas.loadFromJSON(json);
  const bg = parseBackground(json);
  if (bg) canvas.backgroundColor = bg;
  canvas.requestRenderAll();
}

// Tag every object with a stable layer id for the hierarchy stack.
export function ensureLayerIds(canvas: Canvas2) {
  for (const o of canvas.getObjects()) {
    const data = (o.data ?? {}) as Record<string, unknown>;
    if (!data.layerId) {
      o.set("data", { ...data, layerId: uid() });
    }
  }
}

export function labelFor(o: FabricObj): string {
  const t = o.type ?? "";
  if (typeof (o as unknown as { text?: string }).text === "string") {
    return (
      (o as unknown as { text: string }).text.slice(0, 24) || "Text"
    );
  }
  switch (t) {
    case "Rect":
      return "Rectangle";
    case "Circle":
      return "Circle";
    case "Ellipse":
      return "Ellipse";
    case "Triangle":
      return "Triangle";
    case "Image":
      return "Image";
    case "Group":
      return "Group";
    case "Line":
      return "Line";
    default:
      return t || "Layer";
  }
}

export function colorToHex(c: unknown): string {
  if (typeof c === "string" && c.startsWith("#")) return c.slice(0, 7);
  if (typeof c === "string" && c.startsWith("rgb")) {
    // rgb(r, g, b) → hex
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      return (
        "#" +
        [m[1], m[2], m[3]]
          .map((n) => Number(n).toString(16).padStart(2, "0"))
          .join("")
      );
    }
  }
  if (c && typeof c === "object") {
    const maybe = c as { type?: string; colorStops?: unknown[] };
    if (maybe.type === "linear" || maybe.type === "radial") return "#gradient";
  }
  return "#000000";
}

export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "design"
  );
}
export { uid };
