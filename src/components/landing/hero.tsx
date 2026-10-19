"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MousePointer2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Layer = {
  kind: "block" | "text" | "circle" | "triangle";
  x: string;
  y: string;
  size: string;
  color: string;
  text?: string;
  delay: number;
};

// Looping mini-canvas that hints at the real editor.
const LAYERS: Layer[] = [
  { kind: "block", x: "-4%", y: "18%", size: "w-[160%] h-24", color: "#F43F5E", delay: 0 },
  { kind: "circle", x: "70%", y: "-12%", size: "w-44 h-44", color: "#FBBF24", delay: 0.35 },
  { kind: "text", x: "6%", y: "30%", size: "text-6xl md:text-7xl", color: "#FDE047", text: "NEON WAVE", delay: 0.2 },
  { kind: "text", x: "6%", y: "52%", size: "text-xl md:text-3xl", color: "#F0ABFC", text: "season two · episode one", delay: 0.55 },
  { kind: "triangle", x: "78%", y: "58%", size: "w-24 h-24", color: "#A855F7", delay: 0.8 },
  { kind: "block", x: "-4%", y: "84%", size: "w-[120%] h-10", color: "#A855F7", delay: 1.0 },
];

const stats = [
  { label: "Creators", value: "180K+" },
  { label: "Designs exported", value: "12M" },
  { label: "Avg. export time", value: "0.8s" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 md:pb-24">
      <div className="aurora pointer-events-none absolute inset-0 animate-gradient-shift opacity-70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, transparent 40%, rgba(0,0,0,0.35) 90%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="accent" className="mb-5 px-3 py-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by NVIDIA Nemotron Ultra
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl"
          >
            Design anything.
            <br />
            <span className="text-gradient">Ship it in minutes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            The vector canvas that thinks with you. Prompt the AI copilot, drop
            drag-and-drop layers, apply real-time filters — then export
            print-ready PNG, JPEG or PDF at studio definition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/signup">
              <Button variant="gradient" size="lg" className="group">
                Start creating free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/editor/gallery-preview?demo=1">
              <Button variant="outline" size="lg">
                <Wand2 className="h-4 w-4" />
                Try a live design
              </Button>
            </Link>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-4"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-2xl font-bold text-foreground">
                  {s.value}
                </dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Animated preview canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.25, type: "spring", damping: 20 }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-r from-primary/30 via-fuchsia-500/20 to-sky-400/30 blur-3xl" />
          <div className="glass relative overflow-hidden rounded-2xl p-3 shadow-2xl">
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                <MousePointer2 className="h-3 w-3" />
                glow-thumbnail.1280×720
              </span>
            </div>
            <div className="checkerboard relative aspect-video w-full overflow-hidden rounded-xl bg-[#0B0B12]">
              {LAYERS.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6, x: 40, y: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{
                    delay: 0.6 + l.delay,
                    type: "spring",
                    damping: 14,
                    stiffness: 180,
                  }}
                  className={`absolute ${l.kind === "circle" ? "rounded-full" : ""} ${
                    l.kind === "block" ? "rounded-xl" : ""
                  }`}
                  style={{
                    left: l.x,
                    top: l.y,
                    background: l.kind === "text" ? "transparent" : l.color,
                    color: l.color,
                    fontWeight: 800,
                    lineHeight: 1.05,
                    fontFamily: "var(--font-display)",
                    letterSpacing: l.kind === "text" && i === 2 ? "-0.03em" : undefined,
                    clipPath:
                      l.kind === "triangle" ? "polygon(50% 0, 0 100%, 100% 100%)" : undefined,
                    filter: l.kind !== "text" ? "saturate(1.1)" : undefined,
                  }}
                >
                  <span className={l.size}>{l.text}</span>
                </motion.div>
              ))}
              {/* marching selection box */}
              <motion.div
                animate={{
                  scale: [1, 1.04, 1],
                  rotate: [0, 0.4, 0],
                  borderColor: ["rgba(168,85,247,0.9)", "rgba(34,211,238,0.9)", "rgba(168,85,247,0.9)"],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[3%] top-[38%] w-[70%] h-[30%] rounded-lg border-2 border-dashed"
              />
            </div>
            {/* fake toolbar */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-card/80 px-3 py-2">
              <div className="flex gap-2">
                {["#F43F5E", "#FBBF24", "#A855F7", "#22D3EE"].map((c) => (
                  <span
                    key={c}
                    className="h-6 w-6 rounded-md border border-white/10 shadow-inner"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-1">1280×720</span>
                <span className="rounded-md bg-secondary px-2 py-1">PNG · PDF</span>
              </div>
            </div>
          </div>

          {/* floating copilot chip */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass absolute -bottom-5 left-8 flex items-center gap-2 rounded-xl px-3 py-2 text-xs shadow-xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Copilot: “vibrant contrast applied”
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
