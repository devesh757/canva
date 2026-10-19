"use client";

import React, { useEffect, useRef, useState } from "react";
import type {
  Canvas as FabricCanvasT,
  FabricObject as FabricObjectT,
} from "fabric";
import { useEditorStore, type LayerInfo } from "@/store/editor-store";
import {
  setActiveController,
  type CanvasController,
  type SelectionState,
} from "@/lib/fabric/registry";
import {
  colorToHex,
  ensureLayerIds,
  getFabric,
  labelFor,
  serialize,
  type FabricMod,
} from "@/lib/fabric/helpers";
import { createController } from "@/lib/fabric/controller";
import { clamp, uid } from "@/lib/utils";
import { useDebouncedSave } from "./use-debounced-save";

interface Guide {
  id: string;
  axis: "v" | "h";
  at: number;
}

const SNAP_TOL = 8; // scene px tolerance

export function CanvasEngine() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [panning, setPanning] = useState(false);
  const panningRef = useRef(false);
  const dragRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const { queue, saveNow } = useDebouncedSave();

  const zoom = useEditorStore((s) => s.zoom);

  useEffect(() => {
    let disposed = false;
    let canvas: FabricCanvasT | null = null;
    let fabric: FabricMod | null = null;
    let ro: ResizeObserver | null = null;
    let unsubPulse: (() => void) | null = null;
    const store = useEditorStore;

    (async () => {
      // Wait for web fonts so text metrics render correctly.
      try {
        await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      } catch {
        /* noop */
      }
      if (disposed || !canvasElRef.current) return;

      const mod = await getFabric();
      fabric = mod;
      if (disposed) return;

      canvas = new mod.Canvas(canvasElRef.current, {
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        enableRetinaScaling: false,
        stopContextMenu: true,
        fireRightClick: false,
        selection: true,
      });

      const state = store.getState();
      if (state.current && state.current !== "{}") {
        try {
          await canvas.loadFromJSON(state.current);
          const bg = (() => {
            try {
              return (JSON.parse(state.current) as { background?: string })
                .background;
            } catch {
              return null;
            }
          })();
          if (bg) canvas.backgroundColor = bg;
          ensureLayerIds(canvas);
        } catch (e) {
          console.error("[canvas] initial payload failed", e);
        }
      }

      const snapFn = () => serialize(canvas!, fabric!.version ?? "6.x");

      const syncSelection = () => {
        if (!canvas || !fabric) return;
        const a = canvas.getActiveObject();
        if (!a) {
          store.getState().setSelection(null);
          return;
        }
        const ctype = a.type ?? "";
        const isGroup = ctype.toLowerCase().includes("group");
        const isText = a instanceof fabric.Textbox || a instanceof fabric.IText;
        const isImage = a instanceof fabric.FabricImage;
        const data = (a.data ?? {}) as Record<string, unknown>;
        const sel: SelectionState = {
          id: String(data.layerId ?? ""),
          type: isGroup ? "group" : ctype,
          isText: !isGroup && isText,
          isImage: !isGroup && isImage,
          isShape: !isText && !isImage && !isGroup,
          text: isText ? String((a as unknown as { text?: string }).text ?? "") : undefined,
          fontFamily: String(
            (a as unknown as { fontFamily?: string }).fontFamily ?? "Inter"
          ),
          fontSize: Number((a as unknown as { fontSize?: number }).fontSize ?? 32),
          fontWeight: String(
            (a as unknown as { fontWeight?: string | number }).fontWeight ?? 400
          ),
          italic: String((a as unknown as { fontStyle?: string }).fontStyle ?? "").includes(
            "italic"
          ),
          underline: !!(a as unknown as { underline?: boolean }).underline,
          fill: colorToHex(a.fill),
          textAlign: String(
            (a as unknown as { textAlign?: string }).textAlign ?? "left"
          ),
          left: Math.round(a.left ?? 0),
          top: Math.round(a.top ?? 0),
          width: Math.round((a.width ?? 0) * (a.scaleX ?? 1)),
          height: Math.round((a.height ?? 0) * (a.scaleY ?? 1)),
          baseWidth: Math.round(a.width ?? 0),
          baseHeight: Math.round(a.height ?? 0),
          scaleX: a.scaleX ?? 1,
          scaleY: a.scaleY ?? 1,
          angle: Math.round(a.angle ?? 0),
          opacity: a.opacity ?? 1,
          locked: !!(a as unknown as { lockMovementX?: boolean }).lockMovementX,
        };
        store.getState().setSelection(sel);
      };

      const refreshLayers = () => {
        if (!canvas) return;
        const infos: LayerInfo[] = canvas
          .getObjects()
          .map((o: FabricObjectT) => {
            const data = (o.data ?? {}) as Record<string, unknown>;
            return {
              id: String(data.layerId ?? uid()),
              type: o.type ?? "Object",
              label: labelFor(o),
              selected: false,
              visible: o.visible !== false,
              locked: !!(o as unknown as { lockMovementX?: boolean }).lockMovementX,
            };
          })
          .reverse();
        const active = canvas.getActiveObject();
        if (active) {
          const ad = (active.data ?? {}) as Record<string, unknown>;
          const aid = String(ad.layerId ?? "");
          for (const info of infos) info.selected = info.id === aid;
        }
        store.getState().setLayers(infos);
      };

      // ── dimension sync (vpt-based zoom, element = artboard × zoom) ──
      const syncDimensions = () => {
        if (!canvas) return;
        const { designWidth: W, designHeight: H, zoom: z } = store.getState();
        canvas.setDimensions({ width: W * z, height: H * z });
        canvas.setViewportTransform([z, 0, 0, z, 0, 0]);
        canvas.requestRenderAll();
      };

      const fitZoom = () => {
        const vp = viewportRef.current;
        if (!vp) return;
        const { designWidth: W, designHeight: H } = store.getState();
        const pad = 80;
        const zx = (vp.clientWidth - pad) / W;
        const zy = (vp.clientHeight - pad) / H;
        store.getState().setZoom(clamp(Math.min(zx, zy), 0.04, 1), true);
      };

      ro = new ResizeObserver(() => {
        if (store.getState().fitMode) fitZoom();
        else syncDimensions();
      });
      if (viewportRef.current) ro.observe(viewportRef.current);

      fitZoom();
      syncDimensions();
      store.getState().markReady(true);

      // ── snap guides while dragging ──
      const setGuidesState = (list: Guide[]) => setGuides(list);

      const collectEdgeSets = () => {
        if (!canvas) return null;
        const W = store.getState().designWidth;
        const H = store.getState().designHeight;
        const v = new Set<number>([0, W / 2, W]);
        const h = new Set<number>([0, H / 2, H]);
        for (const o of canvas.getObjects()) {
          if (!o.visible) continue;
          const r = o.getBoundingRect();
          v.add(Math.round(r.left));
          v.add(Math.round(r.left + r.width / 2));
          v.add(Math.round(r.left + r.width));
          h.add(Math.round(r.top));
          h.add(Math.round(r.top + r.height / 2));
          h.add(Math.round(r.top + r.height));
        }
        return { v, h };
      };

      const onObjectMoving = (e: { target?: FabricObjectT }) => {
        const target = e.target;
        if (!canvas || !target) return;
        const sets = collectEdgeSets();
        if (!sets) return;
        const r = target.getBoundingRect();
        const tol = SNAP_TOL / clamp(store.getState().zoom, 0.05, 4);
        const out: Guide[] = [];

        const snap = (
          positions: number[],
          targets: Set<number>,
          axis: "v" | "h"
        ) => {
          for (const p of positions) {
            let best: number | null = null;
            let bestDist = Infinity;
            for (const t of targets) {
              const d = Math.abs(t - p);
              if (d <= tol && d < bestDist) {
                bestDist = d;
                best = t;
              }
            }
            if (best !== null) {
              const shift = best - p;
              if (axis === "v") target.left = (target.left ?? 0) + shift;
              else target.top = (target.top ?? 0) + shift;
              out.push({ id: `${axis}:${best}`, axis, at: best });
            }
          }
        };

        snap([r.left, r.left + r.width / 2, r.left + r.width], sets.v, "v");
        snap([r.top, r.top + r.height / 2, r.top + r.height], sets.h, "h");

        target.setCoords();
        canvas.requestRenderAll();
        setGuidesState([...new Set(out.map((g) => `${g.axis}:${g.at}`))].map((id) => {
          const [axis, at] = id.split(":");
          return { id, axis: axis as "v" | "h", at: Number(at) };
        }));
      };

      // ── fabric events ──
      canvas.on("object:modified", () => {
        snapGuard();
      });
      const snapGuard = () => {
        if (!canvas) return;
        store.getState().commitSnapshot(snapFn());
        syncSelection();
      };
      canvas.on("object:moving", onObjectMoving);
      canvas.on("object:skewing", onObjectMoving);
      canvas.on("mouse:up", () => setGuidesState([]));
      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", () => {
        store.getState().setSelection(null);
        refreshLayers();
      });
      canvas.on("object:modified", syncSelection);

      const api = {
        getW: () => store.getState().designWidth,
        getH: () => store.getState().designHeight,
        getSnapshot: snapFn,
        commit: () => {
          const json = snapFn();
          store.getState().commitSnapshot(json);
          queue(json); // debounced autosave
        },
        syncSelection,
        refreshLayers,
        getTitle: () => store.getState().title,
        saveNow: (json: string, _thumbnail: string) => saveNow({ json }),
      };

      const controller = createController(fabric, canvas, api);
      setActiveController(controller);

      // record the initial snapshot as history present
      store.getState().commitSnapshot(snapFn());

      // ── undo/redo pulse + zoom subscriptions ──
      let lastToken = store.getState().historyPulse?.token ?? -1;
      let lastZoom = store.getState().zoom;
      unsubPulse = store.subscribe((s) => {
        if (s.zoom !== lastZoom) {
          lastZoom = s.zoom;
          syncDimensions();
        }
        const pulse = s.historyPulse;
        if (pulse && pulse.token !== lastToken) {
          lastToken = pulse.token;
          void (async () => {
            if (!canvas) return;
            try {
              await canvas.loadFromJSON(pulse.json);
              try {
                const bg = (JSON.parse(pulse.json) as { background?: string })
                  .background;
                if (bg) canvas.backgroundColor = bg;
              } catch {
                /* noop */
              }
              ensureLayerIds(canvas);
              canvas.requestRenderAll();
              syncSelection();
              refreshLayers();
            } catch (err) {
              console.error("[canvas] history replay failed", err);
            }
          })();
        }
      });

      // ── keyboard shortcuts ──
      const isTypingTarget = () => {
        const el = document.activeElement;
        return (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          (el instanceof HTMLElement && el.isContentEditable) ||
          canvas?.getActiveObject() &&
          (canvas.getActiveObject() as unknown as { isEditing?: boolean })
            .isEditing === true
        );
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (isTypingTarget()) return;
        const meta = e.ctrlKey || e.metaKey;
        const s = store.getState();

        if (meta && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) s.redo();
          else s.undo();
          return;
        }
        if (meta && e.key.toLowerCase() === "y") {
          e.preventDefault();
          s.redo();
          return;
        }
        if (meta && e.key.toLowerCase() === "s") {
          e.preventDefault();
          controller.saveNow();
          return;
        }
        if (meta && e.key.toLowerCase() === "d") {
          e.preventDefault();
          void controller.duplicateSelection();
          return;
        }
        if (meta && e.key.toLowerCase() === "a") {
          e.preventDefault();
          canvas?.discardActiveObject();
          const all = canvas?.getActiveObjects();
          void all;
          canvas?.requestRenderAll();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          controller.deleteSelection();
          return;
        }
        if (e.key === "Escape") {
          canvas?.discardActiveObject();
          canvas?.requestRenderAll();
        }
        const a = canvas?.getActiveObject();
        if (a && /^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          a.set({ left: (a.left ?? 0) + dx, top: (a.top ?? 0) + dy } as never);
          a.setCoords();
          canvas?.requestRenderAll();
          store.getState().commitSnapshot(snapFn());
        }
        if (e.code === "Space") {
          panningRef.current = true;
          setPanning(true);
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          panningRef.current = false;
          setPanning(false);
        }
      };

      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey) return; // plain wheel scrolls the viewport
        e.preventDefault();
        const s = store.getState();
        const next = clamp(s.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.04, 4);
        s.setZoom(next, false);
        syncDimensions();
      };

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      viewportRef.current?.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        viewportRef.current?.removeEventListener("wheel", onWheel);
      };
    })();

    return () => {
      disposed = true;
      setActiveController(null);
      unsubPulse?.();
      ro?.disconnect();
      canvas?.dispose();
      canvas = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────── pan with space / middle mouse ─────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && panningRef.current)) {
      const vp = viewportRef.current;
      if (!vp) return;
      dragRef.current = { x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop };
      e.preventDefault();
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    const vp = viewportRef.current;
    if (!d || !vp) return;
    vp.scrollLeft = d.sl - (e.clientX - d.x);
    vp.scrollTop = d.st - (e.clientY - d.y);
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  // ───────────────────── ruler ticks ───────────────────────────────
  const tickPx = Math.max(6, 100 * zoom);
  const rulerStyle: React.CSSProperties = {
    backgroundImage: `repeating-linear-gradient(to right, rgba(148,148,163,0.5) 0 1px, transparent 1px ${tickPx}px)`,
  };
  const rulerLeftStyle: React.CSSProperties = {
    backgroundImage: `repeating-linear-gradient(to bottom, rgba(148,148,163,0.5) 0 1px, transparent 1px ${tickPx}px)`,
  };

  return (
    <div
      ref={viewportRef}
      data-viewport=""
      className="checkerboard relative h-full w-full overflow-auto"
      style={{ cursor: panning ? "grabbing" : undefined }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div className="flex min-h-full min-w-full items-center justify-center p-10">
        <div className="relative shadow-[0_12px_60px_-12px_rgba(0,0,0,0.7)]">
          {/* top & left rulers */}
          <div
            data-testid="rulers"
            className="pointer-events-none absolute -top-5 left-0 h-4 w-full overflow-hidden opacity-80"
          >
            <div className="h-full border-b border-t-muted-foreground/30" style={rulerStyle} />
          </div>
          <div
            className="pointer-events-none absolute -left-5 top-0 h-full w-4 overflow-hidden opacity-80"
          >
            <div className="f h-full border-l border-muted-foreground/30 w-full" style={rulerLeftStyle} />
          </div>

          <canvas ref={canvasElRef} />

          {/* snap guide lines */}
          {guides.map((g) => (
            <div
              key={g.id}
              className="pointer-events-none absolute bg-fuchsia-500/90"
              style={
                g.axis === "v"
                  ? { left: g.at * zoom, top: 0, width: 1, height: "100%" }
                  : { top: g.at * zoom, left: 0, height: 1, width: "100%" }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
