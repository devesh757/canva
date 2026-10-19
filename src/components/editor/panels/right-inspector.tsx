"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Italic,
  Lock,
  Paintbrush,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Underline,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { getActiveController } from "@/lib/fabric/registry";
import type { Command } from "@/lib/ai-commands";

const FONTS = [
  "Inter",
  "Space Grotesk",
  "Arial",
  "Georgia",
  "Impact",
  "Courier New",
  "Verdana",
  "Times New Roman",
];

const TONES = [
  { id: "professional", label: "Pro" },
  { id: "clickbait", label: "Clickbait" },
  { id: "funny", label: "Funny" },
  { id: "short", label: "Shorten" },
] as const;

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full rounded-lg border border-input bg-background/50 px-2 text-xs"
      />
    </label>
  );
}

export function RightInspector() {
  const sel = useEditorStore((s) => s.selection);
  const layers = useEditorStore((s) => s.layers);
  const designWidth = useEditorStore((s) => s.designWidth);
  const designHeight = useEditorStore((s) => s.designHeight);
  const [busyTone, setBusyTone] = useState<string | null>(null);
  const [bg, setBg] = useState("#ffffff");
  const [filterSliders, setFilterSliders] = useState<Record<string, number>>({
    brightness: 0.05,
    contrast: 0.05,
    saturation: 0.15,
    blur: 0.08,
  });

  const c = () => getActiveController();

  async function rewriteTone(tone: string) {
    const sel = useEditorStore.getState().selection;
    if (!sel?.isText || !sel.text) return;
    setBusyTone(tone);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "copywriter",
          prompt: `change tone to ${tone}`,
          context: { selectedText: sel.text },
        }),
      });
      const ct = res.headers.get("content-type") ?? "";
      let newText = "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as { fallbackText?: string };
        newText = data.fallbackText ?? "";
      } else {
        newText = (await res.text()).trim();
      }
      if (newText) c()?.modifySelection({ text: newText });
    } finally {
      setBusyTone(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-card">
      {!sel ? (
        <>
          <Section title="Canvas setup">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => {
                    setBg(e.target.value);
                    c()?.setCanvasBackground(e.target.value);
                  }}
                  title="Background color"
                />
                <Input
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  onBlur={() => c()?.setCanvasBackground(bg)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Artboard</span>
                <span className="font-mono text-xs">
                  {designWidth} × {designHeight}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Layers</span>
                <span className="font-mono text-xs">{layers.length}</span>
              </div>
            </div>
          </Section>
          <div className="p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Quick actions</p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2">
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">DRAG</kbd>
                move + snap alignment
              </li>
              <li className="flex items-center gap-2">
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">CTRL+Z</kbd>
                unlimited history
              </li>
              <li className="flex items-center gap-2">
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">CTRL+D</kbd>
                duplicate layer
              </li>
              <li className="flex items-center gap-2">
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">SPACE+DRAG</kbd>
                pan the viewport
              </li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <Section
            title={
              sel.isText
                ? "Text"
                : sel.isImage
                  ? "Image"
                  : sel.isShape
                    ? "Vector"
                    : "Selection"
            }
            right={
              <Badge variant="outline" className="font-mono">
                {sel.type}
              </Badge>
            }
          >
            {sel.isText && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={sel.fontFamily}
                    onChange={(e) => c()?.modifySelection({ fontFamily: e.target.value })}
                    className="h-8 flex-1 rounded-lg border border-input bg-background/50 px-2 text-xs"
                  >
                    {FONTS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={6}
                    value={sel.fontSize}
                    onChange={(e) =>
                      c()?.modifySelection({ fontSize: clampNum(e.target.value, 6, 400) })
                    }
                    className="h-8 w-16 rounded-lg border border-input bg-background/50 px-2 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {["300", "400", "600", "800", "900"].map((w) => (
                    <IconButton
                      key={w}
                      active={sel.fontWeight === w}
                      onClick={() => c()?.modifySelection({ fontWeight: Number(w) })}
                      className="w-10 text-xs font-semibold"
                    >
                      {w}
                    </IconButton>
                  ))}
                  <IconButton
                    active={sel.italic}
                    onClick={() =>
                      c()?.modifySelection({
                        fontStyle: sel.italic ? "normal" : "italic",
                      })
                    }
                  >
                    <Italic className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    active={sel.underline}
                    onClick={() => c()?.modifySelection({ underline: !sel.underline })}
                  >
                    <Underline className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="flex gap-1">
                  {(
                    [
                      ["left", AlignLeft],
                      ["center", AlignCenter],
                      ["right", AlignRight],
                    ] as const
                  ).map(([align, Icon]) => (
                    <IconButton
                      key={align}
                      active={sel.textAlign === align}
                      onClick={() => c()?.modifySelection({ textAlign: align })}
                    >
                      <Icon className="h-4 w-4" />
                    </IconButton>
                  ))}
                  <IconButton
                    active={sel.fontWeight === "900"}
                    title="Toggle ultra-bold display"
                    onClick={() =>
                      c()?.modifySelection({
                        fontWeight: sel.fontWeight === "900" ? 700 : 900,
                      })
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="color"
                    value={sel.fill.startsWith("#") ? sel.fill : "#ffffff"}
                    onChange={(e) => c()?.modifySelection({ fill: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {sel.isImage && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      "grayscale",
                      "sepia",
                      "invert",
                      "brownie",
                      "vintage",
                    ] as const
                  ).map((f) => (
                    <button
                      key={f}
                      onClick={() => c()?.applyImageFilter(f)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] capitalize transition hover:border-primary/50 hover:bg-primary/5"
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {(
                    [
                      ["brightness", -0.5, 0.5],
                      ["contrast", -0.5, 0.5],
                      ["saturation", -1, 1],
                      ["blur", 0, 0.5],
                    ] as const
                  ).map(([key, min, max]) => (
                    <label key={key} className="block">
                      <span className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                        <span>{key}</span>
                        <span>{filterSliders[key].toFixed(2)}</span>
                      </span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={0.01}
                        value={filterSliders[key]}
                        onChange={(e) =>
                          setFilterSliders((prev) => ({
                            ...prev,
                            [key]: Number(e.target.value),
                          }))
                        }
                        onMouseUp={() =>
                          c()?.applyImageFilter(key, filterSliders[key])
                        }
                        className="w-full accent-[hsl(var(--primary))]"
                      />
                    </label>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => c()?.resetImageFilters()}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset filters
                </Button>
              </div>
            )}

            {sel.isShape && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="color"
                    value={sel.fill.startsWith("#") ? sel.fill : "#a855f7"}
                    onChange={(e) => c()?.modifySelection({ fill: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    value={sel.fill}
                    onChange={(e) => c()?.modifySelection({ fill: e.target.value })}
                    className="h-8 w-24 text-xs font-mono"
                  />
                </div>
                {sel.type === "Rect" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      c()?.modifySelection({
                        rx: 100,
                        ry: 100,
                      })
                    }
                  >
                    <Paintbrush className="h-3.5 w-3.5" /> Make it a pill
                  </Button>
                )}
              </div>
            )}

            {(sel.isText || sel.isImage) && (
              <div className="mt-3 border-t border-border/60 pt-3">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> AI smart copy
                </span>
                <div className="flex flex-wrap gap-1">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      disabled={busyTone === t.id}
                      onClick={() => void rewriteTone(t.id)}
                      className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-[11px] text-primary transition hover:bg-primary/10 disabled:opacity-50"
                    >
                      {busyTone === t.id ? "…" : t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Transform">
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="X"
                value={sel.left}
                onChange={(v) => c()?.modifySelection({ left: v })}
              />
              <Field
                label="Y"
                value={sel.top}
                onChange={(v) => c()?.modifySelection({ top: v })}
              />
              <Field
                label="W"
                value={sel.width}
                min={1}
                onChange={(v) =>
                  c()?.modifySelection({
                    scaleX: clampNum(v, 1, designWidth * 4) /
                      Math.max(sel.baseWidth, 1),
                  })
                }
              />
              <Field
                label="H"
                value={sel.height}
                min={1}
                onChange={(v) =>
                  c()?.modifySelection({
                    scaleY: clampNum(v, 1, designHeight * 4) /
                      Math.max(sel.baseHeight, 1),
                  })
                }
              />
              <Field
                label="Angle"
                value={sel.angle}
                onChange={(v) => c()?.modifySelection({ angle: v })}
              />
              <Field
                label="Opacity"
                value={sel.opacity * 100}
                onChange={(v) => c()?.modifySelection({ opacity: clampNum(v, 0, 100) / 100 })}
                min={0}
                max={100}
              />
            </div>
            <div className="mt-2 flex gap-1">
              {(
                [
                  ["left", "⇤"],
                  ["center", "⇹"],
                  ["right", "⇥"],
                  ["top", "⇞"],
                  ["middle", "⇳"],
                  ["bottom", "⇟"],
                ] as const
              ).map(([mode, glyph]) => (
                <IconButton
                  key={mode}
                  title={`Align ${mode}`}
                  onClick={() => c()?.alignSelection(mode)}
                  className="w-8 text-xs"
                >
                  {glyph}
                </IconButton>
              ))}
            </div>
          </Section>

          <Section title="Layer stack">
            <div className="flex gap-1">
              <IconButton title="Bring to front" onClick={() => c()?.layerOrder("front")}>
                <ArrowUpToLine className="h-4 w-4" />
              </IconButton>
              <IconButton title="Bring forward" onClick={() => c()?.layerOrder("forward")}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton title="Send backwards" onClick={() => c()?.layerOrder("backward")}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton title="Send to back" onClick={() => c()?.layerOrder("back")}>
                <ArrowDownToLine className="h-4 w-4" />
              </IconButton>
              <IconButton
                title={sel.locked ? "Unlock" : "Lock"}
                onClick={() => c()?.toggleLockSelection()}
                active={sel.locked}
              >
                {sel.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </IconButton>
            </div>
            <div className="mt-3 space-y-1">
              {layers.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition cursor-pointer",
                    l.selected
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60"
                  )}
                  onClick={() => c()?.selectLayerById(l.id)}
                >
                  <SlidersHorizontal className="h-3 w-3 shrink-0" />
                  <span className="truncate">{l.label}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px] opacity-60">
                    {l.type}
                  </span>
                </div>
              ))}
              {layers.length === 0 && (
                <p className="py-2 text-center text-[11px] text-muted-foreground">
                  No layers yet — add from the left drawer.
                </p>
              )}
            </div>
          </Section>

          <Section title="Danger zone">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => void c()?.duplicateSelection()}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => c()?.deleteSelection()}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function clampNum(v: number | string, min: number, max: number) {
  const n = typeof v === "number" ? v : Number(v);
  return Math.min(max, Math.max(min, Number.isNaN(n) ? min : n));
}
