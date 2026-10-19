"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, ComponentProps } from "react";

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
            active === t.id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function IconButton({
  active,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { active?: boolean; children: ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        active && "bg-primary/15 text-primary hover:bg-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
