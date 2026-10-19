"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";
import { getActiveController } from "@/lib/fabric/registry";

const AUTOSAVE_DELAY = 1400;

/**
 * Debounced autosave to PATCH /api/designs/:id.
 * - skips overlapping requests; re-flushes if the snapshot changed meanwhile
 * - generates the thumbnail at flush time from the live fabric controller
 * - best-effort flush when the tab is hidden
 */
export function useDebouncedSave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<{ json: string } | null>(null);
  const inFlight = useRef(false);
  const dirtyAgain = useRef(false);

  const flush = useCallback(async () => {
    const payload = latest.current;
    if (!payload) return;
    if (inFlight.current) {
      dirtyAgain.current = true;
      return;
    }
    const s = useEditorStore.getState();
    if (!s.designId) return;

    inFlight.current = true;
    useEditorStore.getState().setSaveState("saving");
    try {
      let thumbnail = "";
      try {
        thumbnail = getActiveController()?.getThumbnailDataUrl() ?? "";
      } catch {
        thumbnail = s.savedAt ? "" : "";
      }
      const res = await fetch(`/api/designs/${s.designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonPayload: payload.json,
          title: useEditorStore.getState().title,
          ...(thumbnail.startsWith("data:") ? { thumbnailUrl: thumbnail } : {}),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        useEditorStore
          .getState()
          .setSaveState("error", err.error ?? "Save failed — retrying soon", null);
        // retry once after a beat
        timer.current = setTimeout(() => void flush(), 3000);
      } else {
        latest.current = null;
        useEditorStore
          .getState()
          .setSaveState("saved", null, new Date().toISOString());
        setTimeout(() => {
          const st = useEditorStore.getState();
          if (st.saveState === "saved" && !latest.current) st.setSaveState("idle");
        }, 2200);
      }
    } catch {
      useEditorStore.getState().setSaveState("error", "Network hiccup", null);
      timer.current = setTimeout(() => void flush(), 3000);
    } finally {
      inFlight.current = false;
      if (dirtyAgain.current && latest.current) {
        dirtyAgain.current = false;
        void flush();
      }
    }
  }, []);

  const queue = useCallback(
    (json: string) => {
      latest.current = { json };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY);
    },
    [flush]
  );

  const saveNow = useCallback(
    (payload?: { json: string; thumbnail?: string }) => {
      if (payload) {
        latest.current = { json: payload.json };
      }
      if (timer.current) clearTimeout(timer.current);
      void flush();
    },
    [flush]
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && latest.current) {
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return { queue, saveNow, flush };
}
