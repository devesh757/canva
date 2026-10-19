import { z } from "zod";

/**
 * Structured design-ops contract. The AI copilot must reply with
 * JSON conforming to { commands: [...], message: string }.
 * The editor canvas engine executes every command sequentially.
 */
export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setCanvas"),
    background: z
      .string()
      .regex(/^#[0-9a-fA-F]{3,8}$/, "Use hex colors like #0F172A")
      .optional(),
    gradient: z
      .object({ from: z.string(), to: z.string(), angle: z.number().optional() })
      .optional(),
  }),
  z.object({
    type: z.literal("addText"),
    text: z.string().min(1).max(220),
    left: z.number().optional(),
    top: z.number().optional(),
    fontSize: z.number().min(8).max(300).optional(),
    fill: z.string().optional(),
    fontWeight: z.number().optional(),
    width: z.number().optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    fontFamily: z.string().optional(),
  }),
  z.object({
    type: z.literal("addShape"),
    shape: z.enum(["rect", "circle", "triangle", "ellipse"]),
    left: z.number().optional(),
    top: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    fill: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    radius: z.number().optional(), // corner radius for rects
  }),
  z.object({
    type: z.literal("setText"),
    find: z.string().min(1).max(300),
    replace: z.string().max(400),
  }),
  z.object({
    type: z.literal("setOverlay"),
    fill: z.string(), // translucent full-bleed dimming rect
    opacity: z.number().min(0).max(1).default(0.35),
  }),
]);

export const copilotReplySchema = z.object({
  message: z.string().default("Done."),
  commands: z.array(commandSchema).default([]),
});

export type Command = z.infer<typeof commandSchema>;
export type CopilotReply = z.infer<typeof copilotReplySchema>;
