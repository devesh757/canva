"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Pause, Play, X, Film } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { getActiveController } from "@/lib/fabric/registry";
import { IconButton } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function FrameSequencer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const layers = useEditorStore((s) => s.layers);

  useEffect(() => setMounted(true), []);

  // isolate mode: hide every layer except the active step
  useEffect(() => {
    const c = getActiveController();
    if (!open || !c) return;
    // click-selecting isolates through visibility toggles for preview only;
    // we apply selection so the inspector tracks the active frame.
    c.selectLayerById(layers[layers.length - 1 - step]?.id ?? "");
  }, [step, open, layers]);

  useEffect(() => {
    if (!playing || !open) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % Math.max(layers.length, 1));
    }, 900);
    return () => clearInterval(t);
  }, [playing, open, layers.length]);

  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (mounted) setPortalHost(document.body);
  }, [mounted]);

  if (!portalHost) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-card/95 p-3 backdrop-blur-xl"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Film className="h-3.5 w-3.5" />
                Layer-by-layer step sequencer · {layers.length} frames
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => setPlaying((p) => !p)} title="Play / Pause">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <IconButton onClick={onClose} title="Close">
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {layers.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setStep(i);
                    setPlaying(false);
                  }}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                    step === i
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    #{i + 1} · {l.type}
                  </span>
                  <span className="block max-w-[120px] truncate text-xs">{l.label}</span>
                </button>
              ))}
              {layers.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Add layers to preview frames.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalHost
  );
}
