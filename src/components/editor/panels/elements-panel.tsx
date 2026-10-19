"use client";

import { useState } from "react";
import { ImageIcon, Shapes, Sparkles } from "lucide-react";
import {
  ELEMENT_ICONS,
  ELEMENT_PHOTOS,
  ELEMENT_SHAPE_OPTS,
  SWATCHES,
} from "@/lib/editor-elements";
import { getActiveController } from "@/lib/fabric/registry";
import { cn } from "@/lib/utils";

type Section = "photos" | "shapes" | "icons";

export function ElementsPanel({ initial = "photos" }: { initial?: Section }) {
  const [section, setSection] = useState<Section>(initial);
  const [color, setColor] = useState("#A855F7");

  const c = () => getActiveController();

  const addIcon = (icon: (typeof ELEMENT_ICONS)[number]) => {
    void (async () => {
      const controller = getActiveController();
      if (!controller) return;
      const size = 120;
      const opts = {
        left: 200,
        top: 200,
        scaleX: size / 24,
        scaleY: size / 24,
        fill: color,
        opacity: 1,
      };
      await controller.addPath(icon.path, opts, icon.label);
    })();
  };

  const addShape = (kind: string) => {
    const controller = c();
    if (!controller) return;
    switch (kind) {
      case "pill":
        void controller.addShape("rect", { rx: 999, ry: 999, width: 420, height: 180 });
        break;
      case "ring":
        void controller.addShape("circle", {
          fill: "transparent",
          stroke: color,
          strokeWidth: 14,
        });
        break;
      case "line":
        void controller.addLine(color);
        break;
      default:
        void controller.addShape(kind);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
        {(
          [
            ["photos", ImageIcon],
            ["shapes", Shapes],
            ["icons", Sparkles],
          ] as const
        ).map(([id, Icon]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition",
              section === id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {id}
          </button>
        ))}
        {(section === "shapes" || section === "icons") && (
          <label className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            tint
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-8"
            />
          </label>
        )}
      </div>

      {(section === "shapes" || section === "icons") && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-border/70 px-3 py-2 no-scrollbar">
          {SWATCHES.map((s) => (
            <button
              key={s}
              onClick={() => setColor(s)}
              className={cn(
                "h-6 w-6 shrink-0 rounded-full border transition-transform hover:scale-110",
                color === s ? "border-foreground scale-110" : "border-white/10"
              )}
              style={{ background: s }}
              title={s}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {section === "photos" && (
          <div className="grid grid-cols-2 gap-2">
            {ELEMENT_PHOTOS.map((p) => (
              <button
                key={p.id}
                onClick={() => void c()?.addImage(p.url, p.label)}
                className="group relative overflow-hidden rounded-xl border border-border"
                title={`Add “${p.label}” photo`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl}
                  alt={p.label}
                  loading="lazy"
                  width={300}
                  height={225}
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/0 text-[10px] font-semibold text-white opacity-0 backdrop-blur-[1px] transition group-hover:bg-black/35 group-hover:opacity-100">
                  + add
                </span>
              </button>
            ))}
          </div>
        )}

        {section === "shapes" && (
          <div className="grid grid-cols-3 gap-2">
            {ELEMENT_SHAPE_OPTS.map((s) => (
              <button
                key={s.shape}
                onClick={() => addShape(s.shape)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 py-3 text-[10px] transition hover:border-primary/50 hover:bg-primary/5"
              >
                <span
                  className="block"
                  style={{
                    width: 30,
                    height: s.shape === "line" ? 4 : 30,
                    background:
                      s.shape === "line"
                        ? color
                        : s.shape === "ring"
                          ? "transparent"
                          : color,
                    border:
                      s.shape === "ring" ? `5px solid ${color}` : "none",
                    borderRadius:
                      s.shape === "circle" || s.shape === "ring"
                        ? "50%"
                        : s.shape === "pill"
                          ? "999px"
                          : "6px",
                  }}
                />
                {s.label}
              </button>
            ))}
          </div>
        )}

        {section === "icons" && (
          <div className="grid grid-cols-3 gap-2">
            {ELEMENT_ICONS.map((ic) => (
              <button
                key={ic.id}
                onClick={() => addIcon(ic)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 py-3 text-[10px] transition hover:border-primary/50 hover:bg-primary/5"
                title={`Add ${ic.label}`}
              >
                <svg viewBox="0 0 24 24" width={30} height={30} fill={color}>
                  <path d={ic.path} />
                </svg>
                {ic.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
