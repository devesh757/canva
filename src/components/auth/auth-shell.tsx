"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Abstract shifting gradient wall shown on the left of auth screens.
const WALL_TILES = [
  "from-violet-600 to-pink-500",
  "from-sky-400 to-indigo-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-fuchsia-500 to-purple-700",
  "from-rose-500 to-red-700",
  "from-cyan-400 to-blue-700",
  "from-lime-400 to-green-600",
  "from-pink-500 to-rose-700",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Gradient asset wall */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="aurora absolute inset-0 animate-gradient-shift" />
        <div className="relative grid h-full grid-cols-3 gap-3 p-3 [perspective:1200px]">
          {WALL_TILES.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: -12 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-end justify-center rounded-2xl bg-gradient-to-br ${g} p-5 shadow-2xl ${
                i % 2 ? "translate-y-8" : ""
              } ${i % 3 === 1 ? "aspect-auto" : ""}`}
            >
              <span className="text-3xl opacity-80">
                {["✨", "🖼️", "🎬", "⚡", "✍️", "🎮", "🎨", "🚀", "🖼️"][i]}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-center [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">
          <div className="mb-3 flex items-center gap-2 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold">Nexa Studio</span>
          </div>
          <p className="max-w-md text-sm text-white/80">
            “The fastest way from blank canvas to published design.”
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center px-4 py-10">
        <div className="aurora pointer-events-none absolute inset-0 opacity-30 lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function OAuthButtons({
  onDemo,
}: {
  onDemo?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          title="OAuth requires provider keys — configure GOOGLE_CLIENT_ID"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium transition hover:bg-secondary/60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>
          Google
        </button>
        <button
          type="button"
          title="OAuth requires provider keys — configure GITHUB_CLIENT_ID"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium transition hover:bg-secondary/60"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>
          GitHub
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          onDemo?.();
        }}
        className="h-11 w-full rounded-lg border border-dashed border-primary/40 text-sm text-primary transition hover:bg-primary/10"
      >
        Use the demo account
      </button>
      <div className="relative py-3 text-center text-xs text-muted-foreground">
        <span className="absolute inset-x-0 top-1/2 border-t border-border" />
        <span className="relative bg-background px-2">or continue with email</span>
      </div>
    </div>
  );
}
