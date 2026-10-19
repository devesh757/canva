import { registerSchema, loginSchema } from "@/lib/validators";
import type { z } from "zod";

export { registerSchema, loginSchema };

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function strength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  const labels = ["too weak", "weak", "fair", "good", "strong"];
  return { score, label: labels[score] };
}
