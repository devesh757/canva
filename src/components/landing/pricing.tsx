"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Tier = {
  name: string;
  icon: string;
  priceMonthly: number;
  priceAnnual: number; // billed yearly, shown per-month
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    icon: "duck", // duck is not exported by lucide; custom chip below
    priceMonthly: 0,
    priceAnnual: 0,
    blurb: "Everything to fall in love with the canvas.",
    features: [
      "Unlimited designs",
      "25 AI copilot generations / mo",
      "PNG + JPEG export",
      "20-step history",
    ],
    cta: "Start free",
  },
  {
    name: "Creator Pro",
    icon: "rocket",
    priceMonthly: 12,
    priceAnnual: 9,
    blurb: "For creators shipping daily across platforms.",
    features: [
      "Everything in Starter",
      "Unlimited AI generations",
      "Print-ready PDF export",
      "Priority render queue",
      "10 team seats",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Studio",
    icon: "sparkles",
    priceMonthly: 39,
    priceAnnual: 29,
    blurb: "Brand kits, white-label exports and onboarding.",
    features: [
      "Everything in Creator Pro",
      "Brand kit presets",
      "White-label exports",
      "Dedicated onboarding",
    ],
    cta: "Contact sales",
  },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  sparkles: Sparkles,
  duck: Crown, // lucide has no duck; use Crown for Starter
};

function Chip({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return (
    <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-20">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-72 aurora opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <span className={!annual ? "font-semibold" : "text-muted-foreground"}>
              Monthly
            </span>
            <Switch checked={annual} onChange={setAnnual} />
            <span className={annual ? "font-semibold" : "text-muted-foreground"}>
              Annual
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
              Save 25%
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {TIERS.map((t) => {
              const price = annual ? t.priceAnnual : t.priceMonthly;
              return (
                <motion.div
                  key={t.name}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    t.highlight
                      ? "border-primary bg-gradient-to-b from-primary/10 to-card shadow-[0_0_60px_-15px] shadow-primary/40"
                      : "border-border bg-card"
                  }`}
                >
                  {t.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                      MOST POPULAR
                    </span>
                  )}
                  <Chip name={t.icon} />
                  <h3 className="mt-4 font-display text-xl font-bold">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={price}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="font-display text-5xl font-bold tracking-tight"
                      >
                        ${price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="pb-1.5 text-sm text-muted-foreground">
                      /mo{annual && price > 0 ? " billed yearly" : ""}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-8">
                    <Button
                      className="w-full"
                      variant={t.highlight ? "gradient" : "outline"}
                    >
                      {t.cta}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
