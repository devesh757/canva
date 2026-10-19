"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ImagePlus,
  LayoutTemplate,
  Shapes,
  Sparkles,
  Square,
  SquareStack,
  Type,
  Upload,
  Circle,
  Triangle,
  Layers,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getActiveController } from "@/lib/fabric/registry";
import { useEditorStore } from "@/store/editor-store";
import { svgPreview } from "@/lib/svg-preview";
import { AiPanel } from "./ai-panel";
import { ElementsPanel } from "./elements-panel";
import { cn } from "@/lib/utils";

interface TemplateCard {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  isPro: boolean;
  jsonPayload: string;
}

const TEXT_PRESETS = [
  { label: "Add a heading", sizeFactor: 0.085, weight: 800 },
  { label: "Add a subheading", sizeFactor: 0.04, weight: 600 },
  { label: "Add body text", sizeFactor: 0.022, weight: 400 },
];

export function LeftDrawer() {
  const [tab, setTab] = useState("templates");
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [aspect, setAspect] = useState<"all" | "landscape" | "portrait">("all");

  const designWidth = useEditorStore((s) => s.designWidth);
  const designHeight = useEditorStore((s) => s.designHeight);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/templates");
        const data = (await res.json()) as { templates?: TemplateCard[] };
        if (!cancelled) setTemplates(data.templates ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useCallback(
    (list: TemplateCard[]) =>
      list
        .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
        .filter((t) => {
          const ratio = t.width / t.height;
          if (aspect === "landscape") return ratio >= 1;
          if (aspect === "portrait") return ratio < 1;
          return true;
        }),
    [search, aspect]
  );

  const onAddText = (p: (typeof TEXT_PRESETS)[number]) => {
    void getActiveController()?.addText({
      text: p.label.replace("Add ", "").replace("a ", ""),
      fontSize: Math.round(designWidth * p.sizeFactor),
      fontWeight: p.weight,
      left: Math.round(designWidth * 0.1),
      top: Math.round(designHeight * 0.42),
    });
  };

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      void getActiveController()?.addImage(String(reader.result), file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <Tabs
        active={tab}
        onChange={setTab}
        className="border-b border-border/70 px-2 py-2"
        tabs={[
          { id: "templates", label: "Templates", icon: <LayoutTemplate className="h-4 w-4" /> },
          { id: "elements", label: "Elements", icon: <Shapes className="h-4 w-4" /> },
          { id: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
          { id: "uploads", label: "Uploads", icon: <Upload className="h-4 w-4" /> },
          { id: "ai", label: "Copilot", icon: <Sparkles className="h-4 w-4" /> },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        {tab === "templates" && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-3 pt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="h-8 w-full rounded-lg border border-input bg-background/50 px-2.5 text-xs"
              />
              <div className="flex rounded-lg bg-secondary/60 p-0.5">
                {(["all", "landscape", "portrait"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-medium capitalize transition",
                      aspect === a ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {a === "landscape" ? "16:9" : a === "portrait" ? "9:19" : "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-3">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-secondary/60" />
                ))}
              {filtered(templates).map((t) => {
                const ratio = t.width / t.height;
                const artboardRatio = designWidth / designHeight;
                const sameAspect =
                  Math.abs(ratio - artboardRatio) < 0.35;
                const svg = svgPreview(t.jsonPayload, t.width, t.height);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (
                        !confirm(
                          "Load this template? It replaces the current canvas (undo still works)."
                        )
                      )
                        return;
                      void getActiveController()?.loadTemplate(t.jsonPayload);
                    }}
                    className="group text-left"
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-xl border border-border bg-secondary/40 transition group-hover:border-primary/50 group-hover:shadow-lg",
                        ratio >= 1 ? "aspect-video" : "aspect-[3/4]"
                      )}
                    >
                      {svg && (
                        <div
                          className="h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      )}
                      <div className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                        <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-900">
                          {sameAspect ? "Apply" : "Replace canvas"}
                        </span>
                      </div>
                      {t.isPro && (
                        <Badge variant="accent" className="absolute right-1.5 top-1.5 shadow">
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium">{t.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "elements" && <ElementsPanel />}

        {tab === "text" && (
          <div className="space-y-2 p-3">
            {TEXT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => onAddText(p)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-3 text-sm transition hover:border-primary/50 hover:bg-primary/5"
              >
                <span
                  style={{ fontWeight: p.weight }}
                  className="truncate"
                >
                  {p.label}
                </span>
                <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Text layers wrap automatically and stay editable on canvas —
              double-click any text to retype it.
            </p>
          </div>
        )}

        {tab === "uploads" && (
          <div className="h-full p-3">
            <label
              className="grid h-36 place-items-center cursor-pointer rounded-xl border-2 border-dashed border-border transition hover:border-primary/60 hover:bg-primary/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void onUpload(file);
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                  e.currentTarget.value = "";
                }}
              />
              <div className="text-center">
                <ImagePlus className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-xs font-medium">Drop an image or browse</p>
                <p className="text-[10px] text-muted-foreground">PNG, JPEG, WebP</p>
              </div>
            </label>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Tip: gradient backdrops and icons live in the{" "}
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <Layers className="h-3 w-3" /> Elements
              </span>{" "}
              tab.
            </p>
          </div>
        )}

        {tab === "ai" && <AiPanel />}
      </div>
    </div>
  );
}
