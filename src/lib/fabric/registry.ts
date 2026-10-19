import type { Command } from "@/lib/ai-commands";
import type { SelectionState } from "@/store/editor-store";

export type { Command };

export interface CanvasController {
  addText(preset?: Partial<Record<string, unknown>>): Promise<void>;
  addShape(shape: string, opts?: Record<string, unknown>): Promise<void>;
  addImage(dataUrl: string, name?: string): Promise<void>;
  addPath(path: string, opts: Record<string, unknown>, label: string): Promise<void>;
  addLine(color: string): Promise<void>;
  loadTemplate(json: string): Promise<void>;
  setCanvasBackground(color: string): void;
  applyCommands(commands: Command[]): Promise<void>;
  modifySelection(props: Record<string, unknown>): void;
  applyImageFilter(key: string, value?: number): void;
  applyTextEffect(mode: "none" | "soft" | "hard" | "glow" | "outline"): void;
  applyGradient(from: string, to: string, angle: "h" | "v" | "diag"): void;
  resetImageFilters(): void;
  deleteSelection(): void;
  duplicateSelection(): Promise<void>;
  toggleLockSelection(): void;
  toggleVisibilitySelection(): void;
  alignSelection(mode: "left" | "center" | "right" | "top" | "middle" | "bottom"): void;
  layerOrder(
    mode: "front" | "back" | "forward" | "backward" | "index"
  ): void;
  selectLayerById(id: string): void;
  reorderBySelectionDelta(delta: number): void;
  exportAs(
    format: "png" | "jpeg" | "pdf",
    scale?: number
  ): Promise<{ dataUrl?: string; blob?: Blob; fileName: string } | null>;
  getThumbnailDataUrl(): string;
  saveNow(): void;
  getActiveJSON(): string;
}

let active: CanvasController | null = null;

export function setActiveController(c: CanvasController | null) {
  active = c;
}

export function getActiveController(): CanvasController | null {
  return active;
}

export const SELECTION_TAP: Record<string, never> = {};
export type { SelectionState };
