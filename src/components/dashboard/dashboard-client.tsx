"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  FileText,
  FlaskConical,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { relativeTime, cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/landing/nav";

export interface DesignRow {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export interface TemplateRow {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  isPro: boolean;
}

const QUICK_STARTS = [
  {
    label: "YouTube Thumbnail",
    emoji: "▶️",
    width: 1280,
    height: 720,
    category: "thumbnail",
    gradient: "from-rose-500/80 via-rose-500/10 to-transparent",
  },
  {
    label: "Reel / TikTok",
    emoji: "📱",
    width: 1080,
    height: 1920,
    category: "reel",
    gradient: "from-fuchsia-500/80 via-fuchsia-500/10 to-transparent",
  },
  {
    label: "Standard Card",
    emoji: "🃏",
    width: 1050,
    height: 1500,
    category: "card",
    gradient: "from-sky-500/80 via-sky-500/10 to-transparent",
  },
  {
    label: "Blank Custom",
    emoji: "⬜",
    width: 1200,
    height: 1200,
    category: "custom",
    gradient: "from-slate-400/80 via-slate-500/10 to-transparent",
  },
];

const CAT_META: Record<string, { emoji: string; gradient: string }> = {
  thumbnail: { emoji: "▶️", gradient: "from-violet-600 to-pink-500" },
  reel: { emoji: "🎬", gradient: "from-orange-500 to-rose-600" },
  card: { emoji: "✍️", gradient: "from-emerald-400 to-teal-600" },
  story: { emoji: "⚡", gradient: "from-amber-400 to-orange-600" },
  presentation: { emoji: "📊", gradient: "from-sky-400 to-blue-700" },
  custom: { emoji: "🎨", gradient: "from-slate-500 to-slate-800" },
};

export default function DashboardClient({
  user,
  designs: initialDesigns,
  templates,
}: {
  user: { name: string; email: string };
  designs: DesignRow[];
  templates: TemplateRow[];
}) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close card menus on outside click
  const onUserQuery = (q: string) => setQuery(q);

  const filtered = useMemo(
    () => designs.filter((d) => d.title.toLowerCase().includes(query.toLowerCase())),
    [designs, query]
  );

  async function createDesign(opts: {
    width: number;
    height: number;
    title: string;
    category: string;
    fromTemplateId?: string;
  }) {
    setSaving(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/editor/${data.design.id}`);
      return data.design.id;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/designs/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const { design } = await res.json();
      setDesigns((prev) => [
        {
          id: design.id,
          title: design.title,
          category: design.category,
          width: design.width,
          height: design.height,
          thumbnailUrl: design.thumbnailUrl,
          updatedAt: design.updatedAt,
        },
        ...prev,
      ]);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this design? This cannot be undone.")) return;
    const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
    if (res.ok) setDesigns((prev) => prev.filter((d) => d.id !== id));
  }

  async function rename(id: string, title: string) {
    if (!title.trim()) return;
    const res = await fetch(`/api/designs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, title: title.trim() } : d)));
    }
    setRenaming(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-sky-400 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden font-display font-bold sm:block">Nexa Studio</span>
          </Link>

          <div className="relative ml-auto flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onUserQuery(e.target.value)}
              placeholder="Search designs…"
              className="pl-9"
              aria-label="Search designs"
            />
          </div>

          <ThemeToggle />
          <Button
            size="sm"
            loading={saving}
            onClick={() =>
              createDesign({
                title: "YouTube Thumbnail",
                width: QUICK_STARTS[0].width,
                height: QUICK_STARTS[0].height,
                category: QUICK_STARTS[0].category,
              })
            }
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New design</span>
          </Button>
          <div className="flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary"
              title={user.email}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Hey {user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What are we designing today?
          </p>
        </motion.div>

        {/* Blank canvas factory */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Start blank
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {QUICK_STARTS.map((q, i) => (
              <motion.button
                key={q.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() =>
                  createDesign({
                    width: q.width,
                    height: q.height,
                    title: q.label,
                    category: q.category,
                  })
                }
                disabled={saving}
                className={cn(
                  "group relative flex h-28 flex-col justify-between overflow-hidden rounded-xl border border-border bg-gradient-to-br p-4 text-left shadow-sm transition hover:border-primary/50",
                  q.gradient
                )}
              >
                <span className="text-2xl">{q.emoji}</span>
                <span>
                  <span className="block font-semibold">{q.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {q.width} × {q.height}
                  </span>
                </span>
                <span className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
                  <Plus className="h-4 w-4 text-primary" />
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Template blueprint row */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            From a template
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {templates.map((t, i) => {
              const meta = CAT_META[t.category] ?? CAT_META.custom;
              const ratio = t.width / t.height;
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() =>
                    createDesign({
                      width: t.width,
                      height: t.height,
                      title: t.title,
                      category: t.category,
                      fromTemplateId: t.id,
                    })
                  }
                  disabled={saving}
                  className="group text-left"
                >
                  <div
                    className={cn(
                      "flex items-center justify-end rounded-xl bg-gradient-to-br p-3 shadow-md",
                      meta.gradient,
                      ratio > 1 ? "aspect-video" : "aspect-[3/4]"
                    )}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-125">
                      {meta.emoji}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.width} × {t.height}
                    {t.isPro && " · PRO"}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Recent designs */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent designs
            </h2>
            {query && (
              <span className="text-xs text-muted-foreground">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No designs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start from a blank canvas or a template above.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((d, i) => {
                const meta = CAT_META[d.category] ?? CAT_META.custom;
                const ratio = d.width / d.height;
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group relative rounded-xl border border-border bg-card p-1.5 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
                  >
                    <Link href={`/editor/${d.id}`} className="block">
                      <div
                        className={cn(
                          "relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br shadow-inner",
                          meta.gradient,
                          ratio > 1 ? "aspect-video" : "aspect-[3/4]"
                        )}
                      >
                        {d.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.thumbnailUrl}
                            alt={d.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">{meta.emoji}</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 px-1.5 pb-1 pt-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={d.title}>
                          {d.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.width}×{d.height} · {relativeTime(d.updatedAt)}
                        </p>
                      </div>
                      <div className="relative" ref={menuRef}>
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setMenuOpen(menuOpen === d.id ? null : d.id);
                          }}
                          className="rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-secondary"
                          aria-label="Design actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen === d.id && (
                          <div
                            className="absolute right-0 top-8 z-30 w-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                              onClick={() => {
                                setRenaming({ id: d.id, title: d.title });
                                setMenuOpen(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Rename
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                              onClick={() => {
                                duplicate(d.id);
                                setMenuOpen(null);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" /> Duplicate
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                remove(d.id);
                                setMenuOpen(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* AI tip banner */}
        <section className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-sky-500/10 p-6 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">AI copilot is armed</p>
            <p className="text-sm text-muted-foreground">
              Open any design and type “make a modern thumbnail template for a
              cooking show with vibrant contrast” to see structured layout ops
              applied live.
            </p>
          </div>
          <Link href="/dashboard">
            <Badge variant="accent">
              <Youtube className="h-3 w-3" /> Demo ready
            </Badge>
          </Link>
        </section>
      </main>

      {/* Rename modal */}
      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename design">
        <Input
          autoFocus
          defaultValue={renaming?.title}
          onKeyDown={(e) => {
            if (e.key === "Enter" && renaming) {
              rename(renaming.id, (e.target as HTMLInputElement).value);
            }
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRenaming(null)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => renaming && rename(renaming.id, renaming.title)}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
