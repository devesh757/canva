import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_0_24px_-6px] shadow-primary/60 hover:brightness-110 active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
  outline:
    "border border-input bg-transparent hover:bg-secondary/60 active:scale-[0.98]",
  ghost: "hover:bg-secondary/60 active:scale-[0.98]",
  destructive:
    "bg-destructive text-destructive-foreground hover:brightness-110 active:scale-[0.98]",
  gradient:
    "bg-[linear-gradient(120deg,hsl(var(--primary)),#38bdf8_55%,#f472b6)] text-white shadow-[0_0_32px_-8px] shadow-primary/70 hover:brightness-110 active:scale-[0.98]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
} as const;

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export { variants as buttonVariants };
