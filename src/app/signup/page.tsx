"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/forms";
import { AuthShell, OAuthButtons } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { strength } from "@/lib/forms";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const pw = watch("password", "");
  const meter = strength(pw);

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Registration failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const useDemo = () => {
    setValue("name", "Demo Designer");
    setValue("email", "demo@nexa.studio");
    setValue("password", "password123");
  };

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold">Create your studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free forever for starters. No card required.
        </p>
      </div>

      <OAuthButtons onDemo={useDemo} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Ada Lovelace" {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@studio.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="8+ characters"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  meter.score > i
                    ? ["bg-destructive", "bg-amber-400", "bg-sky-400", "bg-emerald-500"][
                        meter.score - 1
                      ]
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{meter.label}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
