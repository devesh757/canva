"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Boxes,
  Check,
  Layers,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Layers,
    title: "Vector Layer Engine",
    desc: "Infinite zoom, per-layer opacity, rotation and depth re-ordering with full serialize-state history.",
    badges: ["Zustand history", "Undo / redo", "Layer stack"],
    row: 0,
  },
  {
    icon: ScanLine,
    title: "Real-time Filters",
    desc: "GPU-accelerated image pipelines — brightness, saturation, blur, gray and sepia applied on the fly.",
    badges: ["Non-destructive", "Live preview"],
    row: 1,
  },
  {
    icon: Sparkles,
    title: "Nemotron AI Copilot",
    desc: "Chat with your canvas. Generate layouts, rewrite copy in any tone and rebalance composition automatically.",
    badges: ["Streaming", "Structured design ops"],
    row: 2,
  },
];

const MATRIX: { label: string; free: string; pro: string; note?: string }[] = [
  { label: "Canvas layer imports", free: "PNG · SVG bound", pro: "Everything + JSON blueprints" },
  { label: "AI copilot generations", free: "25 / month", pro: "Unlimited, priority queue" },
  { label: "Smart copywriter tones", free: "2 tones", pro: "All 6 tones + brand voice" },
  { label: "Export formats", free: "PNG · JPEG", pro: "PNG · JPEG · print-ready PDF" },
  { label: "Version history", free: "20 steps", pro: "Unlimited + named snapshots" },
  { label: "Team workspaces", free: "—", pro: "Up to 10 seats" },
];

export function Features() {
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  return (
    <section id="features" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            <Workflow className="h-3.5 w-3.5" /> Feature matrix
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built like a pro tool, priced for everyone
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
              <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {f.badges.map((b) => (
                  <Badge key={b} variant="default">
                    {b}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive comparison matrix */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mt-10 overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border bg-secondary/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
            <span className="flex items-center gap-2">
              <Boxes className="h-4 w-4" /> Capability
            </span>
            <span>Free</span>
            <span className="text-primary">Pro</span>
          </div>
          {MATRIX.map((row, i) => (
            <div
              key={row.label}
              onMouseEnter={() => setHoverRow(i)}
              onMouseLeave={() => setHoverRow(null)}
              className={`grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 px-4 py-3.5 text-sm transition-colors sm:px-6 ${
                hoverRow === i ? "bg-primary/5" : ""
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                {row.label}
              </span>
              <span className={row.free === "—" ? "text-muted-foreground" : ""}>
                {row.free}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4 text-emerald-500" />
                {row.pro}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
