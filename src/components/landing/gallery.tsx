"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type TemplateCard = {
  title: string;
  category: string;
  dims: string;
  gradient: string;
  emoji: string;
};

const CATEGORIES = ["all", "thumbnail", "reel", "card", "story"] as const;

const CARDS: TemplateCard[] = [
  { title: "Glow Gaming", category: "thumbnail", dims: "1280 × 720", gradient: "from-violet-600 to-pink-500", emoji: "🎮" },
  { title: "Faceless AI", category: "thumbnail", dims: "1280 × 720", gradient: "from-indigo-600 to-cyan-400", emoji: "🤖" },
  { title: "Hook Reel", category: "reel", dims: "1080 × 1920", gradient: "from-orange-500 to-rose-600", emoji: "🎬" },
  { title: "Story Sale", category: "story", dims: "1080 × 1920", gradient: "from-amber-400 to-orange-600", emoji: "⚡" },
  { title: "Quote Card", category: "card", dims: "1050 × 1500", gradient: "from-emerald-400 to-teal-600", emoji: "✍️" },
  { title: "Greeting Card", category: "card", dims: "1050 × 1500", gradient: "from-fuchsia-500 to-purple-700", emoji: "🎂" },
  { title: "Business Card", category: "card", dims: "1050 × 600", gradient: "from-slate-700 to-slate-900", emoji: "💼" },
  { title: "Greeting Story", category: "story", dims: "1080 × 1920", gradient: "from-sky-400 to-blue-700", emoji: "✨" },
];

export function Gallery() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("all");
  const filtered = active === "all" ? CARDS : CARDS.filter((c) => c.category === active);

  return (
    <section id="templates" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Templates
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Start from a blueprint
          </h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Pixel-exact canvas sizes for every platform. Pick one, remix it with
            the copilot, export in one click.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-xl bg-secondary/50 p-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`relative rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                active === c ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active === c && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((c) => (
            <motion.div
              key={c.title}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              whileHover={{ y: -6 }}
              className="group relative"
            >
              <div
                className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} p-4 shadow-lg`}
              >
                <span className="text-5xl drop-shadow-lg transition-transform duration-300 group-hover:scale-125">
                  {c.emoji}
                </span>
                <span className="absolute left-3 top-3 rounded-md bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {c.category}
                </span>
                <span className="absolute bottom-3 left-3 text-[11px] text-white/85">
                  {c.dims}
                </span>
                <div className="absolute inset-0 flex items-end justify-center bg-black/0 p-4 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                  <Link href="/signup" tabIndex={-1}>
                    <Button size="sm" variant="primary" className="pointer-events-none">
                      Use template
                    </Button>
                  </Link>
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{c.title}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
