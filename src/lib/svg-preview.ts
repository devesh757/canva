// Renders a Fabric.js v6 JSON payload into an SVG string.
// Pure functions — safe on server (RSC) and in the browser.
// Supports the layer types the editor produces: Rect, Circle, Ellipse,
// Triangle, Textbox/IText, Line, Path (incl. gradient fills + rotation).

export interface PreviewOpts {
  /** wrap text to the textbox width with this heuristic */
  charWidthFactor?: number;
}

interface ObjJson {
  type: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  radius?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  fill?: string | GradientJson;
  stroke?: string;
  strokeWidth?: number;
  visible?: boolean;
  text?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  fontFamily?: string;
  textAlign?: string;
  scaleX2?: never;
  underline?: boolean;
  lineHeight?: number;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  path?: string;
  transform?: string;
  data?: Record<string, unknown>;
}

interface GradientJson {
  type?: string;
  colorStops?: { offset: number; color: string }[];
  coords?: { x1: number; y1: number; x2: number; y2: number };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTextToLines(
  text: string,
  fontSize: number,
  boxWidth: number,
  factor: number
): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(" ");
    let line = "";
    const maxChars = Math.max(2, Math.floor(boxWidth / (fontSize * factor)));
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

interface GradientDef {
  id: string;
  svg: string;
}

export function svgPreview(
  json: string,
  width: number,
  height: number,
  opts: PreviewOpts = {}
): string | null {
  try {
    const parsed = JSON.parse(json) as {
      background?: string;
      objects?: ObjJson[];
    };
    const bg = parsed.background ?? "#ffffff";
    const objects = parsed.objects ?? [];
    const defs: GradientDef[] = [];
    let body = "";
    let gid = 0;

    for (const o of objects) {
      if (o.visible === false) continue;
      const left = o.left ?? 0;
      const top = o.top ?? 0;
      const scaleX = o.scaleX ?? 1;
      const scaleY = o.scaleY ?? 1;
      const rot = o.angle ?? 0;
      const opacity = o.opacity ?? 1;
      const rotate =
        rot && !Number.isNaN(rot)
          ? ` transform="rotate(${rot} ${left} ${top})"`
          : "";

      // gradient fill definition — fabric percentage units give 0..1 coords
      let fillAttr = "";
      if (typeof o.fill === "object" && o.fill && "colorStops" in o.fill) {
        const id = `g${gid++}`;
        const stops = o.fill.colorStops as { offset: number; color: string }[];
        const coords = o.fill.coords ?? { x1: 0, y1: 0, x2: 1, y2: 0 };
        defs.push({
          id,
          svg: `<linearGradient id="${id}" gradientUnits="objectBoundingBox" x1="${(coords.x1 ?? 0).toFixed(
            3
          )}" y1="${(coords.y1 ?? 0).toFixed(3)}" x2="${(coords.x2 ?? 1).toFixed(
            3
          )}" y2="${(coords.y2 ?? 1).toFixed(3)}">${stops
            .map(
              (s) =>
                `<stop offset="${s.offset}" stop-color="${esc(s.color)}"/>`
            )
            .join("")}</linearGradient>`,
        });
        fillAttr = `url(#${id})`;
      } else if (typeof o.fill === "string") {
        fillAttr = o.fill;
      }

      const strokeAttr =
        o.stroke
          ? ` stroke="${esc(o.stroke)}" stroke-width="${o.strokeWidth ?? 1}"`
          : "";
      const commonAttrs = `opacity="${opacity}"${rotate}`;

      switch ((o.type ?? "").toLowerCase()) {
        case "rect": {
          const w = (o.width ?? 0) * scaleX;
          const h = (o.height ?? 0) * scaleY;
          body += `<rect x="${left}" y="${top}" width="${w}" height="${h}" rx="${
            (o.rx ?? 0) * Math.min(scaleX, scaleY)
          }" ry="${(o.ry ?? 0) * Math.min(scaleX, scaleY)}" fill="${
            fillAttr || "#000"
          }"${strokeAttr} ${commonAttrs}/>`;
          break;
        }
        case "circle": {
          const r = (o.radius ?? (o.width ?? 0) / 2) * scaleX;
          const cx = left + r;
          const cy = top + r;
          body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${
            fillAttr || "none"
          }"${strokeAttr} ${commonAttrs}/>`;
          break;
        }
        case "ellipse": {
          const rx = (o.rx ?? (o.width ?? 0) / 2) * scaleX;
          const ry = (o.ry ?? (o.height ?? 0) / 2) * scaleY;
          body += `<ellipse cx="${left + rx}" cy="${top + ry}" rx="${rx}" ry="${ry}" fill="${
            fillAttr || "none"
          }"${strokeAttr} ${commonAttrs}/>`;
          break;
        }
        case "triangle": {
          const w = (o.width ?? 0) * scaleX;
          const h = (o.height ?? 0) * scaleY;
          body += `<polygon points="${left},${top + h} ${left + w / 2},${top} ${
            left + w
          },${top + h}" fill="${fillAttr || "#000"}"${strokeAttr} ${commonAttrs}/>`;
          break;
        }
        case "textbox":
        case "text":
        case "itext": {
          const fs = o.fontSize ?? 32;
          const w = (o.width ?? 400) * scaleX;
          const align = o.textAlign ?? "left";
          const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
          const x = align === "center" ? left + w / 2 : align === "right" ? left + w : left;
          const lh = (o.lineHeight ?? 1.16) * fs;
          const factor = opts.charWidthFactor ?? 0.56;
          const lines = wrapTextToLines(
            o.text ?? "",
            fs,
            w,
            factor
          );
          if (!lines.length) break;
          const weight = o.fontWeight ?? 400;
          const family = esc(o.fontFamily ?? "Inter, sans-serif");
          const deco = o.underline ? ' text-decoration="underline"' : "";
          const style = o.fontStyle === "italic" ? ' font-style="italic"' : "";
          body += `<text x="${x}" y="${top}" font-family="${family}" font-size="${fs}" font-weight="${weight}" fill="${
            fillAttr || "#000"
          }" text-anchor="${anchor}"${deco}${style} ${commonAttrs}>${lines
            .map(
              (l, i) =>
                `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(
                  l
                )}</tspan>`
            )
            .join("")}</text>`;
          break;
        }
        case "line": {
          const x1 = left + (o.x1 ?? 0);
          const y1 = top + (o.y1 ?? 0);
          const x2 = left + (o.x2 ?? 0);
          const y2 = top + (o.y2 ?? 0);
          body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${esc(
            typeof o.stroke === "string"
              ? o.stroke
              : typeof o.fill === "string"
                ? o.fill
                : "#000"
          )}" stroke-width="${o.strokeWidth ?? 2}" ${commonAttrs}/>`;
          break;
        }
        case "path": {
          body += `<path d="${esc(o.path ?? "")}" fill="${
            fillAttr || "#000"
          }"${strokeAttr} transform="translate(${left},${top}) scale(${scaleX},${scaleY}) rotate(${rot})" ${commonAttrs}/>`;
          break;
        }
        default:
          break;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img">
  <rect width="${width}" height="${height}" fill="${esc(bg)}"/>
  ${defs.length ? `<defs>${defs.map((d) => d.svg).join("")}</defs>` : ""}
  ${body}
</svg>`;
    return svg;
  } catch {
    return null;
  }
}

/** Compact data URL for <img> tags (asterisks escaped, encoded) */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
