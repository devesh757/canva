"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize,
  Minus,
  Plus,
  Redo2,
  TriangleAlert,
  Undo2,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { getActiveController } from "@/lib/fabric/registry";
import { cn } from "@/lib/utils";
import { FrameSequencer } from "./frame-sequencer";

function SaveBadge() {
  const state = useEditorStore((s) => s.saveState);
  const savedAt = useEditorStore((s) => s.savedAt);
  const entries: Record<string, [string, React.ReactNode]> = {
    idle: ["Saved", <Cloud key="i" className="h-3.5 w-3.5 text-emerald-500" />],
    saved: ["Saved", <Check key="s" className="h-3.5 w-3.5 text-emerald-500" />],
    saving: ["Saving…", <Loader2 key="g" className="h-3.5 w-3.5 animate-spin" />],
    dirty: ["Unsaved changes", <Cloud key="d" className="h-3.5 w-3.5 text-muted-foreground" />],
    error: ["Save failed", <TriangleAlert key="e" className="h-3.5 w-3.5 text-destructive" />],
  };
  const [label, icon] = entries[state];
  return (
    <span
      className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
      title={savedAt ? `Last synced ${new Date(savedAt).toLocaleTimeString()}` : undefined}
    >
      {icon}
      {label}
    </span>
  );
}

export function EditorTopbar() {
  const router = useRouter();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const past = useEditorStore((s) => s.past.length);
  const future = useEditorStore((s) => s.future.length);
  const zoom = useEditorStore((s) => s.zoom);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [seqOpen, setSeqOpen] = useState(false);
  const layers = useEditorStore((s) => s.layers);
  const designWidth = useEditorStore((s) => s.designWidth);
  const designHeight = useEditorStore((s) => s.designHeight);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const doExport = async (fmt: "png" | "jpeg" | "pdf") => {
    setExporting(fmt);
    try {
      await getActiveController()?.exportAs(
        fmt,
        fmt === "pdf" ? undefined : 2
      );
    } catch (e) {
      console.error("[export]", e);
    } finally {
      setExporting(null);
      setExportOpen(false);
    }
  };

  const isReelish = designHeight / 1 >= designWidth * 1.5 && layers.length > 0;

  return (
    <header className="z-30 flex h-12 items-center gap-2 border-b border-border/70 bg-card px-2 sm:px-3">
      <Link
        href="/dashboard"
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        title="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-9 w-full min-w-0 max-w-[220px] rounded-lg bg-transparent px-2 font-display text-sm font-semibold outline-none transition hover:bg-secondary/60 focus-visible:bg-secondary/80 sm:w-56"
        aria-label="Design title"
      />

      <SaveBadge />

      <div className="ml-auto flex items-center gap-1">
        <div className="flex items-center rounded-lg bg-secondary/60 p-0.5">
          <button
            onClick={() => useEditorStore.getState().undo()}
            disabled={past === 0}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => useEditorStore.getState().redo()}
            disabled={future === 0}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* zoom control */}
        <div className="hidden items-center gap-0.5 rounded-lg bg-secondary/60 p-0.5 sm:flex">
          <button
            onClick={() => useEditorStore.getState().setZoom(Math.max(0.04, zoom * 0.85), false)}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => useEditorStore.getState().setZoom(fitZoomNow())}
            className="rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Fit to screen"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => useEditorStore.getState().setZoom(Math.min(4, zoom * 1.15), false)}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="hidden rounded-lg bg-secondary/60 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground md:block">
          {Math.round(zoom * 100)}%
        </div>

        {isReelish && (
          <Button variant="ghost" size="sm" onClick={() => setSeqOpen(true)}>
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Frames</span>
          </Button>
        )}

        {/* export dropdown */}
        <div className="relative" ref={exportRef}>
          <Button size="sm" variant="gradient" onClick={() => setExportOpen((v) => !v)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-2xl">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Web formats
              </p>
              {(
                [
                  ["png", "PNG image", ImageIcon, "2× resolution"],
                  ["jpeg", "JPEG image", ImageIcon, "2× · optimized"],
                ] as const
              ).map(([fmt, label, Icon, sub]) => (
                <button
                  key={fmt}
                  onClick={() => void doExport(fmt)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-secondary"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="flex-1">
                    <span className="block text-sm">{label}</span>
                    <span className="block text-[10px] text-muted-foreground">{sub}</span>
                  </span>
                  {exporting === fmt && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                </button>
              ))}
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Print
              </p>
              <button
                onClick={() => void doExport("pdf")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-secondary"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span className="flex-1">
                  <span className="block text-sm">PDF (print-ready)</span>
                  <span className="block text-[10px] text-muted-foreground">
                    High-definition vector-safe
                  </span>
                </span>
                {exporting === "pdf" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </button>
            </div>
          )}
        </div>
      </div>

      <FrameSequencer open={seqOpen} onClose={() => setSeqOpen(false)} />
    </header>
  );
}

// Compute and set a fit zoom from the on-screen viewport size.
function fitZoomNow(): number {
  const s = useEditorStore.getState();
  const vp = document.querySelector<HTMLElement>("[data-viewport]");
  if (!vp) return s.zoom;
  const zx = (vp.clientWidth - 80) / s.designWidth;
  const zy = (vp.clientHeight - 80) / s.designHeight;
  const z = Math.min(Math.max(0.04, Math.min(zx, zy)), 1);
  s.setZoom(z, true);
  return z;
}
