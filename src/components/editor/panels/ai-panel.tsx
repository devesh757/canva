"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Send, Sparkles, Trash2, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editor-store";
import { getActiveController } from "@/lib/fabric/registry";
import { copilotReplySchema, type CopilotReply } from "@/lib/ai-commands";

type Mode = "copilot" | "layout";

const SUGGESTIONS = [
  "Make a modern thumbnail template for a cooking show with vibrant color contrast",
  "Dark tech launch cover with a glowing headline",
  "Add a bold sale banner with yellow accents",
];

interface Msg {
  id: number;
  role: "user" | "ai";
  kind?: Mode;
  text: string;
  applied?: boolean;
  commands?: number;
}

let msgSeq = 1;

// Tolerant extraction of the first JSON object in a (possibly fenced/textual) reply
function extractJson(raw: string): unknown | null {
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

const applyReply = async (reply: CopilotReply) => {
  if (reply.commands?.length) {
    await getActiveController()?.applyCommands(reply.commands);
  }
};

export function AiPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const designWidth = useEditorStore((s) => s.designWidth);
  const designHeight = useEditorStore((s) => s.designHeight);
  const layers = useEditorStore((s) => s.layers);
  const designId = useEditorStore((s) => s.designId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(mode: Mode, prompt: string) {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { id: msgSeq++, role: "user", text: prompt }]);

    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        prompt,
        context: {
          designWidth,
          designHeight,
          layerCount: layers.length,
          payloadSummary: layers
            .slice(0, 12)
            .map((l) => `${l.type}:${l.label}`)
            .join(", "),
        },
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setMessages((m) => [
        ...m,
        { id: msgSeq++, role: "ai", text: err.error ?? "Generation failed — try again in a moment." },
      ]);
      setBusy(false);
      return;
    }

    // non-stream fallback JSON payload
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const data = (await res.json()) as Partial<CopilotReply> & { source?: string; fallbackText?: string };
      setUsingFallback(data.source === "fallback");
      let parsed = copilotReplySchema.safeParse(data);
      if (!parsed.success) {
        parsed = copilotReplySchema.safeParse({ message: "Applied heuristic tweaks.", commands: [] });
      }
      await applyReply(parsed.data as CopilotReply);
      setMessages((m) => [
        ...m,
        {
          id: msgSeq++,
          role: "ai",
          kind: mode,
          text: (parsed.data as CopilotReply).message || "DONE",
          applied: true,
          commands: (parsed.data as CopilotReply).commands.length,
        },
      ]);
      setBusy(false);
      return;
    }

    // streamed text path
    const reader = res.body?.getReader();
    if (!reader) {
      setBusy(false);
      return;
    }
    const decoder = new TextDecoder();
    let raw = "";
    let acc = "";
    const streamId = msgSeq++;
    setMessages((m) => [...m, { id: streamId, role: "ai", kind: mode, text: "" }]);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      acc = raw;
      setMessages((m) =>
        m.map((msg) =>
          msg.id === streamId
            ? { ...msg, text: acc.slice(0, 4000) }
            : msg
        )
      );
    }
    // attempt structured apply
    const json = extractJson(raw);
    if (json) {
      const parsed = copilotReplySchema.safeParse(json);
      if (parsed.success) {
        await applyReply(parsed.data as CopilotReply);
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamId
              ? {
                  ...msg,
                  text: parsed.data.message || "Applied.",
                  applied: true,
                  commands: parsed.data.commands.length,
                }
              : msg
          )
        );
      } else {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamId
              ? { ...msg, text: raw?.slice(0, 600) || "Empty reply." }
              : msg
          )
        );
      }
    } else {
      // maybe the model answered prose — treat as copywriter text into selection
      const sel = useEditorStore.getState().selection;
      if (sel?.isText && raw.trim()) {
        getActiveController()?.modifySelection({ text: raw.trim() });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamId ? { ...msg, text: raw.trim(), applied: true } : msg
          )
        );
      }
    }
    setBusy(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <Badge variant="accent">
            <Sparkles className="h-3 w-3" /> {usingFallback ? "Local engine" : "Nemotron Ultra"}
          </Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Ask the copilot to build or restyle the canvas. It edits layers directly.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send("copilot", s)}
                className="w-full rounded-xl border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              >
                “{s}”
              </button>
            ))}
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <span className="font-semibold text-primary">Copilot</span>
                    {m.applied && (
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <Zap className="h-2.5 w-2.5" />
                        {m.commands} change{m.commands === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="text-xs text-muted-foreground"
          >
            Thinking…
          </motion.div>
        )}
      </div>

      <div className="border-t border-border/70 p-2">
        {designId.length === 0 && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Canvas not ready yet
          </div>
        )}
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send("copilot", input);
            }
          }}
          placeholder="Describe a change… e.g. “vibrant cooking show thumbnail”"
          className="resize-none text-xs"
        />
        <div className="mt-1.5 flex items-center gap-1.5">
          <Button
            variant="gradient"
            className="flex-1"
            onClick={() => void send("copilot", input)}
            loading={busy}
            disabled={!input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            Generate
          </Button>
          <Button
            variant="outline"
            title="Suggest layout balance tweaks"
            onClick={() => void send("layout", "Analyze and improve this layout balance")}
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            title="Clear chat"
            onClick={() => setMessages([])}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
