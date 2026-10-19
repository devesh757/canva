"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Shapes, SlidersHorizontal, X } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { EditorTopbar } from "./editor-topbar";
import { LeftDrawer } from "./panels/left-drawer";
import { RightInspector } from "./panels/right-inspector";
import { cn } from "@/lib/utils";

// Fabric.js + the whole canvas engine are browser-only and heavy —
// keep them out of the initial JS bundle and skip server rendering.
const CanvasEngine = dynamic(() => import("./canvas-engine").then((m) => m.CanvasEngine), {
  ssr: false,
  loading: () => (
    <div className="checkerboard flex h-full w-full items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default function EditorShell({
  design,
}: {
  design: {
    id: string;
    title: string;
    category: string;
    width: number;
    height: number;
    jsonPayload: string;
    meta?: string;
  };
}) {
  const init = useEditorStore((s) => s.init);
  const [sheet, setSheet] = useState<null | "left" | "right">(null);

  // hydrate the store exactly once per design id
  useEffect(() => {
    init({
      id: design.id,
      title: design.title,
      category: design.category,
      width: design.width,
      height: design.height,
      initialPayload: design.jsonPayload || "{}",
      meta: design.meta,
    });
  }, [design, init]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <EditorTopbar />
      <div className="relative flex min-h-0 flex-1">
        {/* left asset drawer */}
        <aside className="hidden w-[300px] shrink-0 border-r border-border/70 md:block">
          <LeftDrawer />
        </aside>

        {/* canvas stage */}
        <main className="relative min-w-0 flex-1 bg-[radial-gradient(circle_at_30%_10%,rgba(168,85,247,0.07),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(34,211,238,0.06),transparent_45%)]">
          <CanvasEngine />

          {/* mobile tool toggles */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:hidden">
            <button
              onClick={() => setSheet("left")}
              className="flex items-center gap-1.5 rounded-full bg-card/95 px-4 py-2 text-xs font-semibold shadow-lg shadow-black/30 backdrop-blur"
            >
              <Shapes className="h-4 w-4 text-primary" />
              Assets
            </button>
            <button
              onClick={() => setSheet("right")}
              className="flex items-center gap-1.5 rounded-full bg-card/95 px-4 py-2 text-xs font-semibold shadow-lg shadow-black/30 backdrop-blur"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Style
            </button>
          </div>
        </main>

        {/* right inspector */}
        <aside className="hidden w-[280px] shrink-0 border-l border-border/70 lg:block">
          <RightInspector />
        </aside>

        {/* mobile bottom sheets */}
        {sheet && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Close panel"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet(null)}
            />
            <div className="absolute inset-x-0 bottom-0 flex h-[74dvh] flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl">
              <button
                onClick={() => setSheet(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-secondary/70 p-1.5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              {sheet === "left" ? <LeftDrawer /> : <RightInspector />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}