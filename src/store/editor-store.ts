"use client";

import { create } from "zustand";

export interface LayerInfo {
  id: string;
  type: string;
  label: string;
  selected: boolean;
  visible: boolean;
  locked: boolean;
}

export interface SelectionState {
  id: string | undefined;
  type: string;
  isText: boolean;
  isImage: boolean;
  isShape: boolean;
  text?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  italic: boolean;
  underline: boolean;
  fill: string;
  textAlign: string;
  left: number;
  top: number;
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  locked: boolean;
}

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

interface HistoryBase {
  past: string[];
  current: string;
  future: string[];
}

const HISTORY_LIMIT = 50;

export interface EditorState extends HistoryBase {
  designId: string;
  title: string;
  category: string;
  meta: Record<string, unknown>;
  designWidth: number;
  designHeight: number;
  // canvas-coordination
  ready: boolean;
  saveState: SaveState;
  saveError: string | null;
  savedAt: string | null;
  selection: SelectionState | null;
  layers: LayerInfo[];
  zoom: number; // absolute zoom factor (scene -> screen)
  fitMode: boolean;
  // pulse that tells the canvas engine to load a history snapshot
  historyPulse: { json: string; token: number } | null;

  init(d: {
    id: string;
    title: string;
    category: string;
    width: number;
    height: number;
    initialPayload: string;
    meta?: string;
  }): void;
  setTitle(t: string): void;
  markReady(v: boolean): void;
  setSaveState(s: SaveState, error?: string | null, savedAt?: string | null): void;
  commitSnapshot(json: string): void;
  undo(): void;
  redo(): void;
  setSelection(s: SelectionState | null): void;
  setLayers(l: LayerInfo[]): void;
  setLayersById(fn: (l: LayerInfo[]) => LayerInfo[]): void;
  setZoom(z: number, fit?: boolean): void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  designId: "",
  title: "Untitled design",
  category: "custom",
  meta: {},
  designWidth: 1280,
  designHeight: 720,
  ready: false,
  saveState: "idle",
  saveError: null,
  savedAt: null,
  selection: null,
  layers: [],
  zoom: 0.5,
  fitMode: true,
  historyPulse: null,
  past: [],
  current: "{}",
  future: [],

  init: ({ id, title, category, width, height, initialPayload, meta }) =>
    set(
      (state) =>
        state.current === initialPayload && state.designId === id
          ? state
          : {
              ...state,
              designId: id,
              title,
              category,
              designWidth: width,
              designHeight: height,
              current: initialPayload,
              past: [],
              future: [],
              ready: false,
              saveState: "idle",
              saveError: null,
              savedAt: null,
              selection: null,
              layers: [],
              historyPulse: null,
              meta: meta ? safeJson(meta, {}) : {},
            }
    ),

  setTitle: (title) => set({ title, saveState: "dirty" }),

  markReady: (v) => set({ ready: v }),

  setSaveState: (saveState, saveError = null, savedAt = undefined) =>
    set((s) => ({
      saveState,
      saveError: saveError === undefined ? s.saveError : saveError,
      savedAt: savedAt === undefined ? s.savedAt : savedAt,
    })),

  commitSnapshot: (json) => {
    const { current, past, future } = get();
    if (json === current) return;
    const nextPast = [...past, current].slice(-HISTORY_LIMIT);
    set({
      past: nextPast,
      current: json,
      future: [],
      saveState: "dirty",
    });
  },

  undo: () => {
    const { current, past, future } = get();
    if (!past.length) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      current: previous,
      future: [current, ...future].slice(0, HISTORY_LIMIT),
      saveState: "dirty",
      historyPulse: { json: previous, token: (get().historyPulse?.token ?? 0) + 1 },
    });
  },

  redo: () => {
    const { current, past, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      past: [...past, current].slice(-HISTORY_LIMIT),
      current: next,
      future: future.slice(1),
      saveState: "dirty",
      historyPulse: { json: next, token: (get().historyPulse?.token ?? 0) + 1 },
    });
  },

  setSelection: (selection) =>
    set((s) =>
      shallowEqSelection(s.selection, selection) ? { selection } : { selection }
    ),

  setLayers: (layers) => set({ layers }),
  setLayersById: (fn) => set((s) => ({ layers: fn(s.layers) })),

  setZoom: (zoom, fit = false) => set({ zoom, fitMode: fit }),
}));

function safeJson(raw: string | undefined, fallback: Record<string, unknown>) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : fallback;
  } catch {
    return fallback;
  }
}

function shallowEqSelection(
  a: SelectionState | null,
  b: SelectionState | null
) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height &&
    a.angle === b.angle &&
    a.fill === b.fill &&
    a.fontSize === b.fontSize &&
    a.fontWeight === b.fontWeight &&
    a.fontFamily === b.fontFamily &&
    a.textAlign === b.textAlign &&
    a.opacity === b.opacity &&
    a.text === b.text
  );
}
