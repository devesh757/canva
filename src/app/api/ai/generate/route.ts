import { getUser, mustAuth, jsonError } from "@/lib/api-helpers";
import { aiModeSchema } from "@/lib/validators";
import type { CopilotReply } from "@/lib/ai-commands";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AiMode = "copilot" | "copywriter" | "layout";

interface ReplyBody extends CopilotReply {
  fallbackText?: string;
}

// Rudimentary in-memory rate limit (per user, 30 req/min).
const hits = new Map<string, number[]>();
function rateLimited(userId: string) {
  const now = Date.now();
  const window = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  window.push(now);
  hits.set(userId, window);
  return window.length > 30;
}

const COPILOT_SYSTEM = `You are the design copilot inside a Canva-like editor. The user asks you to create or restyle a canvas design. Reply with ONE JSON object only (no markdown fences, no prose outside JSON):
{"message":"one short friendly sentence","commands":[...]}
Available command types:
{"type":"setCanvas","background":"#RRGGBB"} — canvas background color.
{"type":"addText","text":"...","left":number,"top":number,"fontSize":number,"fill":"#RRGGBB","fontWeight":number,"width":number,"textAlign":"left|center|right"} — headline first (fontSize 60-110, bold), then smaller sublines (fontSize 20-36).
{"type":"addShape","shape":"rect|circle|triangle|ellipse","left":number,"top":number,"width":number,"height":number,"fill":"#RRGGBB","opacity":0-1,"radius":number}
{"type":"setText","find":"existing text","replace":"new text"} — edits an existing text layer.
{"type":"setOverlay","fill":"#RRGGBB","opacity":0.3-0.6} — full-bleed dimming layer for photo backgrounds.
Rules: keep all coordinates INSIDE the canvas (design width/height provided). Headline in the upper third, never at 0,0. Use strong accessible contrast pairs. Include 2-4 text layers and 1-3 accent shapes per generated design. All colors must be hex.`;

const COPYWRITER_SYSTEM = `You are the inline copy refiner inside an editor. Rewrite the given text according to the user's instruction (rephrase, shorten, change tone: professional/funny/clickbait, or fix overflow). Reply with ONLY the rewritten text — no quotes, no explanation, no trailing signature.`;

const LAYOUT_SYSTEM = `You are a layout consultant analyzing a canvas layer summary. Reply with ONE JSON object only:
{"message":"...","commands":[...]}
Use the same command vocabulary as the design copilot: setCanvas, addText, addShape, setOverlay. Fix imbalance only — add balance shapes if the layout is empty or sparse; never overlap the headline with new text. If the layout already looks balanced, return {"message":"Layout looks balanced — no changes applied.","commands":[]}.`;

async function nvidiaStream(
  system: string,
  user: string,
  baseUrl: string,
  model: string,
  key: string
) {
  return fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1400,
      stream: true,
    }),
  });
}

function userContext(
  mode: AiMode,
  prompt: string,
  ctx: {
    designWidth?: number;
    designHeight?: number;
    layerCount?: number;
    selectedText?: string;
    payloadSummary?: string;
  }
) {
  if (mode === "copywriter") {
    return `Original text:\n"""\n${ctx.selectedText ?? prompt}\n"""\nInstruction: ${prompt}`;
  }
  const dims =
    ctx.designWidth && ctx.designHeight
      ? `Canvas: ${ctx.designWidth}x${ctx.designHeight}px.`
      : "";
  const layers = ctx.layerCount != null ? `Current layers: ${ctx.layerCount}.` : "";
  const summary = ctx.payloadSummary
    ? `Payload summary: ${ctx.payloadSummary.slice(0, 3000)}`
    : "";
  return [dims, layers, summary, `User request: ${prompt}`]
    .filter(Boolean)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Heuristic offline engine — keeps the studio fully usable without    */
/* an NVIDIA_API_KEY by producing deterministic, valid design ops.     */
/* ------------------------------------------------------------------ */

const PALETTES: Record<string, string[]> = {
  cooking: ["#F97316", "#FDE68A", "#F0FDF4"],
  food: ["#F97316", "#FDE68A", "#fff7ed"],
  fitness: ["#84CC16", "#F8FAFC", "#A3E635"],
  gaming: ["#A855F7", "#E879F9", "#22D3EE"],
  sale: ["#EAB308", "#FEF08A", "#FFFFFF"],
  discount: ["#EAB308", "#FEF08A", "#FFFFFF"],
  podcast: ["#38BDF8", "#FDE047", "#F8FAFC"],
  travel: ["#0EA5E9", "#FBBF24", "#164E63"],
  tech: ["#6366F1", "#22D3EE", "#F1F5F9"],
  music: ["#EC4899", "#8B5CF6", "#FFF1F2"],
  neon: ["#22D3EE", "#A855F7", "#F0ABFC"],
  vibrant: ["#F43F5E", "#FBBF24", "#10B981"],
  dark: ["#0F172A", "#38BDF8", "#E2E8F0"],
  light: ["#E0F2FE", "#6366F1", "#0F172A"],
};

function pickPalette(prompt: string): string[] {
  const p = prompt.toLowerCase();
  for (const key of Object.keys(PALETTES)) {
    if (p.includes(key)) return PALETTES[key];
  }
  return PALETTES.vibrant;
}

const STOP_WORDS = new Set([
  "make", "a", "an", "the", "modern", "thumbnail", "template", "for", "with",
  "show", "style", "design", "vibrant", "color", "contrast", "please",
  "create", "generate", "and", "clean", "bold", "post", "reel", "story",
  "card", "greeting", "business", "new",
]);

function extractTopicWords(prompt: string): string {
  const words = prompt
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));
  return (
    words
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") || "Bold Title"
  );
}

function fallbackCopilot(prompt: string, W: number, H: number): CopilotReply {
  const palette = pickPalette(prompt);
  const topic = extractTopicWords(prompt);
  const wantsLight = prompt.toLowerCase().includes("light");
  const bg = wantsLight ? "#F8FAFC" : "#0C0A09";
  const textPrimary = wantsLight ? "#0C0A09" : "#FAFAFA";
  const accent = palette[0];
  const secondary = palette[1];
  const wall = Math.max(48, Math.min(W, H) * 0.07);

  return {
    message: `Generated a ${wantsLight ? "light" : "bold dark"} layout for “${topic}”.`,
    commands: [
      { type: "setCanvas", background: bg },
      {
        type: "addShape",
        shape: "rect",
        left: 0,
        top: Math.round(H * 0.72),
        width: W,
        height: Math.round(H * 0.28),
        fill: secondary,
        opacity: 0.9,
      },
      {
        type: "addShape",
        shape: "circle",
        left: Math.round(wall * 1.6),
        top: Math.round(wall * 0.5),
        width: Math.round(Math.max(64, W * 0.115)),
        height: Math.round(Math.max(64, W * 0.115)),
        fill: accent,
      },
      {
        type: "addText",
        text: topic,
        left: Math.round(wall * 3.4),
        top: Math.round(wall * 0.5),
        fontSize: Math.round(Math.min(W * 0.085, 104)),
        fill: accent,
        fontWeight: 800,
        width: W - wall * 4.2,
        textAlign: "left",
      },
      {
        type: "addText",
        text: `${topic} — now streaming`,
        left: Math.round(wall * 1.5),
        top: Math.round(H * 0.78),
        fontSize: Math.round(Math.min(W * 0.03, 40)),
        fill: textPrimary,
        fontWeight: 600,
        width: W - wall * 3,
        textAlign: "left",
      },
    ],
  };
}

function fallbackCopywriter(prompt: string, text: string) {
  const lower = prompt.toLowerCase();
  const tone = ["professional", "clickbait", "funny", "short"].find((t) =>
    lower.includes(t)
  );
  const clean = text.trim().replace(/\s+/g, " ") || "Your headline goes here";
  switch (tone) {
    case "clickbait":
      return `${clean.split(".")[0].toUpperCase()} — YOU WON'T BELIEVE #2`;
    case "funny":
      return `${clean.replace(/[!.]+$/, "")} (yes, really 🍕)`;
    case "short": {
      const words = clean.split(" ");
      return words.slice(0, 6).join(" ") + (words.length > 6 ? "…" : "");
    }
    case "professional":
      return clean
        .replace(/[!?]{1,}/g, ".")
        .replace(/\s*\b(wow|omg|super)\b\s*/gi, " ")
        .trim();
    default:
      return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}

function fallbackLayout(
  layerCount: number,
  W: number,
  H: number
): CopilotReply {
  if (layerCount === 0) {
    const base = fallbackCopilot("bold modern balanced layout", W, H);
    return base;
  }
  if (layerCount > 8) {
    return {
      message: "Canvas is dense — consider merging decorative shapes.",
      commands: [],
    };
  }
  if (layerCount < 3) {
    return {
      message: "Layout felt sparse — added balance accents.",
      commands: [
        {
          type: "addShape",
          shape: "triangle",
          left: Math.round(W * 0.78),
          top: Math.round(H * 0.08),
          width: Math.round(W * 0.11),
          height: Math.round(W * 0.11),
          fill: "#A855F7",
          opacity: 0.85,
        },
        {
          type: "addShape",
          shape: "circle",
          left: Math.round(W * 0.09),
          top: Math.round(H * 0.82),
          width: Math.round(W * 0.07),
          height: Math.round(W * 0.07),
          fill: "#22D3EE",
          opacity: 0.9,
        },
      ],
    };
  }
  return {
    message: "Layout looks balanced — no changes applied.",
    commands: [],
  };
}

/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const user = await getUser(req);
  const guard = mustAuth(user);
  if (guard) return guard;
  if (rateLimited(user!.id)) {
    return jsonError("Too many AI requests — take a breather", 429);
  }

  const parsed = aiModeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid AI request payload", 422);
  const { mode, prompt, context } = parsed.data;

  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl =
    process.env.NVIDIA_BASE_URL ||
    "https://integrate.api.nvidia.com/v1/chat/completions";
  const model =
    process.env.NVIDIA_MODEL || "nvidia/llama-3.1-nemotron-70b-instruct";

  // ---- Offline fallback path --------------------------------------
  if (!apiKey) {
    const W = context.designWidth ?? 1280;
    const H = context.designHeight ?? 720;
    let body: ReplyBody;
    if (mode === "copilot") {
      body = fallbackCopilot(prompt, W, H);
    } else if (mode === "copywriter") {
      body = {
        message: "",
        commands: [],
        fallbackText: fallbackCopywriter(prompt, context.selectedText ?? ""),
      };
    } else {
      body = fallbackLayout(context.layerCount ?? 0, W, H);
    }
    return NextResponse.json({ source: "fallback", ...body });
  }

  // ---- NVIDIA streaming path --------------------------------------
  const system =
    mode === "copilot"
      ? COPILOT_SYSTEM
      : mode === "copywriter"
        ? COPYWRITER_SYSTEM
        : LAYOUT_SYSTEM;

  try {
    const upstream = await nvidiaStream(
      system,
      userContext(mode, prompt, context),
      baseUrl,
      model,
      apiKey
    );
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return jsonError(
        `NVIDIA API error ${upstream.status}: ${detail.slice(0, 200)}`,
        502
      );
    }

    // Translate NVIDIA SSE frames into a clean plain-text delta stream.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // partial SSE frame — safe to skip
              }
            }
          }
        } catch (e) {
          console.error("[ai:stream]", e);
        } finally {
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("[ai:generate]", e);
    return jsonError("AI generation failed upstream", 502);
  }
}
