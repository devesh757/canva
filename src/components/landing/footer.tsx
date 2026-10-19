import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-sky-400 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display font-bold">Nexa.</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI creative studio — design, generate, export. Built on a
            high-performance vector canvas.
          </p>
        </div>
        {[
          {
            title: "Product",
            links: ["Templates", "Feature matrix", "Pricing", "Changelog"],
          },
          {
            title: "Resources",
            links: ["Docs", "API keys", "Design ops guide", "Community"],
          },
          {
            title: "Legal",
            links: ["Privacy", "Terms", "Security", "Licenses"],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l}>
                  <span className="cursor-pointer text-muted-foreground transition hover:text-foreground">
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nexa Studio — demo project. Not affiliated with Canva.
      </div>
    </footer>
  );
}
