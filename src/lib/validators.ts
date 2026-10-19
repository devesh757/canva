import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(48),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password needs at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(48).optional(),
  image: z.string().url().optional(),
});

export const designCreateSchema = z.object({
  title: z.string().min(1).max(80).default("Untitled design"),
  category: z.string().max(40).default("custom"),
  width: z.number().int().min(64).max(8192).default(1280),
  height: z.number().int().min(64).max(8192).default(720),
  fromTemplateId: z.string().optional(),
});

export const designSaveSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  jsonPayload: z.string().max(6_500_000).optional(),
  thumbnailUrl: z.string().max(1_500_000).nullable().optional(),
});

export const aiModeSchema = z.object({
  mode: z.enum(["copilot", "copywriter", "layout"]),
  prompt: z.string().min(1).max(2000),
  context: z.object({
    designWidth: z.number().optional(),
    designHeight: z.number().optional(),
    layerCount: z.number().optional(),
    selectedText: z.string().max(4000).optional(),
    payloadSummary: z.string().max(4000).optional(),
  }),
});
