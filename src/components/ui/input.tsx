import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-shadow";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(inputClass, "min-h-[80px] py-2", className)}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {children}
    </label>
  );
}
