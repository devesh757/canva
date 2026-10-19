import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { svgPreview, svgToDataUrl } from "../src/lib/svg-preview";

const db = new PrismaClient();

/* ------------------------------------------------ helpers ---------- */

// gradient fill object — fabric v6 percentage-unit serialization format
const G = (
  c1: string,
  c2: string,
  x2 = 0,
  y2 = 1,
  c3?: string
): Record<string, unknown> => ({
  type: "linear",
  coords: { x1: 0, y1: 0, x2, y2 },
  colorStops: c3
    ? [
        { offset: 0, color: c1 },
        { offset: 0.6, color: c2 },
        { offset: 1, color: c3 },
      ]
    : [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 },
      ],
  offsetX: 0,
  offsetY: 0,
  gradientUnits: "percentage",
});

type Obj = Record<string, unknown> & { type: string };

const T = (text: string, extra: Record<string, unknown> = {}): Obj => ({
  type: "Textbox",
  text,
  left: 0,
  top: 0,
  width: 560,
  fontSize: 72,
  fill: "#ffffff",
  fontFamily: "Inter",
  fontWeight: 600,
  textAlign: "left",
  ...extra,
});

const canvasJson = (background: string, objects: Obj[]) =>
  JSON.stringify({ version: "6.5.2", background, objects });

/* ----------------------------------------- background gradients ---- */

/* ------------------------------------------------- templates ------ */

interface TemplateSpec {
  title: string;
  category: string;
  width: number;
  height: number;
  isPro: boolean;
  meta?: Record<string, unknown>;
  background: string;
  objects: Obj[];
}

const templates: TemplateSpec[] = [
  /* ============================= THUMBNAIL (1280x720) ============ */
  {
    title: "Glow — Gaming Thumbnail",
    category: "thumbnail",
    width: 1280,
    height: 720,
    isPro: false,
    background: "#0B0B12",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1280, height: 720, fill: G("#7C3AED", "#0B0B12", 0.8, 1), opacity: 0.55 },
      { type: "Circle", left: 950, top: -120, width: 380, height: 380, radius: 190, fill: G("#22D3EE", "#A855F7", 1, 1), opacity: 0.9 },
      { type: "Circle", left: 1040, top: -30, width: 200, height: 200, radius: 100, fill: "transparent", stroke: "#F8FAFC", strokeWidth: 3, opacity: 0.5 },
      { type: "Triangle", left: 90, top: 90, width: 120, height: 110, fill: "#FDE047", opacity: 0.95 },
      { type: "Textbox", text: "NEON WAVE", left: 90, top: 260, width: 820, fontSize: 128, fill: "#F8FAFC", fontWeight: 900, fontFamily: "Inter", lineHeight: 1 },
      { type: "Textbox", text: "NEW SEASON · EPISODE ONE", left: 94, top: 420, width: 700, fontSize: 40, fill: "#22D3EE", fontWeight: 700, letterSpacing: 40 },
      { type: "Rect", left: 0, top: 610, width: 1280, height: 110, fill: "#A855F7", opacity: 0.92 },
      { type: "Textbox", text: "watch the trailer — link in description", left: 90, top: 640, width: 900, fontSize: 36, fill: "#0C0A09", fontWeight: 700 },
    ],
  },
  {
    title: "Faceless — AI Channel",
    category: "thumbnail",
    width: 1280,
    height: 720,
    isPro: false,
    background: "#0F1220",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 420, height: 720, fill: G("#6366F1", "#22D3EE", 0, 1), opacity: 0.4 },
      { type: "Circle", left: 120, top: 210, width: 180, height: 180, radius: 90, fill: "#22D3EE", opacity: 0.85 },
      { type: "Textbox", text: "AI can\nedit faster\nthan you.", left: 480, top: 110, width: 720, fontSize: 92, fill: "#F8FAFC", fontWeight: 800, lineHeight: 1.08 },
      { type: "Rect", left: 480, top: 520, width: 210, height: 56, rx: 28, ry: 28, fill: "#22D3EE" },
      { type: "Textbox", text: "faceless automation", left: 505, top: 532, width: 400, fontSize: 28, fill: "#0F1220", fontWeight: 700 },
    ],
  },
  {
    title: "Neon — Product End Card",
    category: "thumbnail",
    width: 1280,
    height: 720,
    isPro: true,
    background: "#070711",
    objects: [
      { type: "Circle", left: 340, top: 90, width: 560, height: 560, radius: 280, fill: G("#F43F5E", "#A855F7", 1, 0.4), opacity: 0.35 },
      { type: "Rect", left: 335, top: 92, width: 570, height: 566, rx: 283, ry: 283, fill: "transparent", stroke: "#F8FAFC", strokeWidth: 2, opacity: 0.35 },
      { type: "Textbox", text: "WATCH NEXT", left: 90, top: 92, width: 500, fontSize: 46, fill: "#F8FAFC", fontWeight: 800, letterSpacing: 20 },
      { type: "Textbox", text: "Studio Pro\nProduct Tour", left: 90, top: 180, width: 520, fontSize: 74, fill: "#FDE047", fontWeight: 900, lineHeight: 1.05 },
      { type: "Circle", left: 110, top: 420, width: 90, height: 90, radius: 45, fill: "#22D3EE" },
      { type: "Circle", left: 225, top: 420, width: 90, height: 90, radius: 45, fill: "#F43F5E" },
      { type: "Circle", left: 340, top: 420, width: 90, height: 90, radius: 45, fill: "#FDE047" },
      { type: "Textbox", text: "03:12 · full walkthrough", left: 90, top: 580, width: 520, fontSize: 30, fill: "#A5B4FC", fontWeight: 500 },
    ],
  },
  {
    title: "Sunset — Blog Title Card",
    category: "thumbnail",
    width: 1280,
    height: 720,
    isPro: false,
    background: "#FDBA74",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1280, height: 720, fill: G('#F97316', '#EC4899', 1, 1), opacity: 0.9 },
      { type: "Circle", left: 830, top: -160, width: 420, height: 420, radius: 210, fill: "#FDE68A", opacity: 0.7 },
      { type: "Rect", left: 90, top: 200, width: 560, height: 6, fill: "#F8FAFC", opacity: 0.8 },
      { type: "Textbox", text: "Slow Sundays", left: 90, top: 240, width: 760, fontSize: 110, fill: "#FFF7ED", fontWeight: 600, fontFamily: "Playfair Display" },
      { type: "Textbox", text: "a slow-living journal — endless brunch series", left: 92, top: 390, width: 720, fontSize: 36, fill: "#FFEBD4", fontWeight: 400, fontStyle: "italic", fontFamily: "Playfair Display" },
    ],
  },

  /* ============================= VIDEO ============================ */
  {
    title: "Hype — Reel Hook",
    category: "video",
    width: 1080,
    height: 1920,
    isPro: false,
    meta: { kind: "video", durationSec: 15, animated: true },
    background: "#0C0A1A",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1080, height: 1920, fill: G("#A855F7", "#0C0A1A", 0, 1), opacity: 0.75 },
      { type: "Rect", left: 90, top: 500, width: 460, height: 64, rx: 32, ry: 32, fill: "#FDE047", },
      { type: "Textbox", text: "WAIT FOR IT", left: 130, top: 512, width: 420, fontSize: 36, fill: "#0C0A1A", fontWeight: 800 },
      { type: "Textbox", text: "This trick\nchanged my\nwhole workflow", left: 120, top: 620, width: 840, fontSize: 120, fill: "#F8FAFC", fontWeight: 800, lineHeight: 1.05 },
      { type: "Circle", left: 700, top: 1300, width: 260, height: 260, radius: 130, fill: "transparent", stroke: "#22D3EE", strokeWidth: 5, opacity: 0.8 },
      { type: "Textbox", text: "swipe up ↗", left: 320, top: 1660, width: 440, fontSize: 54, fill: "#FDE047", fontWeight: 700, textAlign: "center" },
    ],
  },
  {
    title: "Teardown — Product Teaser Loop",
    category: "video",
    width: 1080,
    height: 1920,
    isPro: true,
    meta: { kind: "video", durationSec: 20, animated: true },
    background: "#101014",
    objects: [
      { type: "Circle", left: 240, top: 640, width: 600, height: 600, radius: 300, fill: G("#22D3EE", "#101014", 0, 1), opacity: 0.65 },
      { type: "Rect", left: 420, top: 700, width: 240, height: 240, rx: 40, ry: 40, fill: "#F8FAFC", opacity: 0.9, angle: 8 },
      { type: "Textbox", text: "THE DROP", left: 90, top: 240, width: 700, fontSize: 84, fill: "#F8FAFC", fontWeight: 900, letterSpacing: 40 },
      { type: "Textbox", text: "REVEAL", left: 300, top: 950, width: 480, fontSize: 110, fill: "#22D3EE", fontWeight: 900, textAlign: "center" },
      { type: "Rect", left: 0, top: 1780, width: 1080, height: 140, fill: "#22D3EE", opacity: 0.95 },
      { type: "Textbox", text: "product drop — 10.24", left: 0, top: 1810, width: 1080, fontSize: 44, fill: "#101014", fontWeight: 800, textAlign: "center" },
    ],
  },
  {
    title: "Live Now — Stream Intro",
    category: "video",
    width: 1920,
    height: 1080,
    isPro: false,
    meta: { kind: "video", durationSec: 8, animated: true },
    background: "#0A0E14",
    objects: [
      { type: "Circle", left: 1140, top: 190, width: 380, height: 380, radius: 190, fill: "transparent", stroke: "#F43F5E", strokeWidth: 5, opacity: 0.7 },
      { type: "Rect", left: 140, top: 130, width: 220, height: 66, rx: 33, ry: 33, fill: "#F43F5E" },
      { type: "Textbox", text: "● LIVE", left: 190, top: 145, width: 200, fontSize: 34, fill: "#FFFFFF", fontWeight: 800 },
      { type: "Textbox", text: "BUILT FROM\nSCRATCH", left: 140, top: 330, width: 1200, fontSize: 150, fill: "#F8FAFC", fontWeight: 900, lineHeight: 1.02 },
      { type: "Textbox", text: "season finale — code marathon", left: 140, top: 700, width: 900, fontSize: 44, fill: "#94A3B8", fontWeight: 500 },
      { type: "Rect", left: 140, top: 860, width: 380, height: 8, fill: "#22D3EE" },
    ],
  },
  {
    title: "Recipe — 3-Step Reel",
    category: "video",
    width: 1080,
    height: 1920,
    isPro: false,
    meta: { kind: "video", durationSec: 45, animated: true },
    background: "#FFF7ED",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1080, height: 640, fill: G("#F97316", "#FDBA74", 0, 1) },
      { type: "Textbox", text: "15-MIN\nRAMEN", left: 90, top: 120, width: 900, fontSize: 130, fill: "#FFF7ED", fontWeight: 900, lineHeight: 1 },
      { type: "Circle", left: 90, top: 820, width: 120, height: 120, radius: 60, fill: "#F97316" },
      { type: "Textbox", text: "1", left: 90, top: 850, width: 120, fontSize: 56, fill: "#FFF7ED", fontWeight: 800, textAlign: "center" },
      { type: "Textbox", text: "Boil broth + noodles (4 min)", left: 250, top: 860, width: 700, fontSize: 44, fill: "#1C1917", fontWeight: 600 },
      { type: "Circle", left: 90, top: 1060, width: 120, height: 120, radius: 60, fill: "#F97316" },
      { type: "Textbox", text: "2", left: 90, top: 1090, width: 120, fontSize: 56, fill: "#FFF7ED", fontWeight: 800, textAlign: "center" },
      { type: "Textbox", text: "Char the scallions in sesame oil", left: 250, top: 1100, width: 700, fontSize: 44, fill: "#1C1917", fontWeight: 600 },
      { type: "Circle", left: 90, top: 1300, width: 120, height: 120, radius: 60, fill: "#F97316" },
      { type: "Textbox", text: "3", left: 90, top: 1330, width: 120, fontSize: 56, fill: "#FFF7ED", fontWeight: 800, textAlign: "center" },
      { type: "Textbox", text: "Soft egg, chili crisp, green onions", left: 250, top: 1340, width: 700, fontSize: 44, fill: "#1C1917", fontWeight: 600 },
      { type: "Rect", left: 90, top: 1600, width: 900, height: 96, rx: 48, ry: 48, fill: "#1C1917", },
      { type: "Textbox", text: "full recipe pinned ⤴", left: 0, top: 1622, width: 1080, fontSize: 40, fill: "#FFF7ED", fontWeight: 700, textAlign: "center" },
    ],
  },
  {
    title: "Subscribe — Animated CTA",
    category: "video",
    width: 1280,
    height: 720,
    isPro: false,
    meta: { kind: "video", durationSec: 10, animated: true },
    background: "#111318",
    objects: [
      { type: "Rect", left: 260, top: 190, width: 760, height: 340, rx: 40, ry: 40, fill: "#F8FAFC", opacity: 0.06 },
      { type: "Rect", left: 260, top: 190, width: 760, height: 340, rx: 40, ry: 40, fill: "transparent", stroke: "#A855F7", strokeWidth: 3 },
      { type: "Textbox", text: "1 subscriber?", left: 330, top: 240, width: 640, fontSize: 64, fill: "#F8FAFC", fontWeight: 800 },
      { type: "Textbox", text: "LET'S MAKE IT 2", left: 330, top: 340, width: 640, fontSize: 52, fill: "#A855F7", fontWeight: 900 },
      { type: "Rect", left: 560, top: 450, width: 160, height: 50, rx: 25, ry: 25, fill: "#F43F5E" },
      { type: "Textbox", text: "SUB", left: 560, top: 462, width: 160, fontSize: 28, fill: "#FFFFFF", fontWeight: 800, textAlign: "center" },
    ],
  },

  /* ============================= ADS ============================== */
  {
    title: "Flash — Square Sale Ad",
    category: "ads",
    width: 1080,
    height: 1080,
    isPro: false,
    background: "#111111",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1080, height: 1080, fill: G("#FDE047", "#F59E0B", 1, 1), opacity: 0.95 },
      { type: "Circle", left: 760, top: 120, width: 220, height: 220, radius: 110, fill: "#111111", opacity: 0.9 },
      { type: "Textbox", text: "-50%", left: 760, top: 190, width: 220, fontSize: 60, fill: "#FDE047", fontWeight: 900, textAlign: "center" },
      { type: "Textbox", text: "FLASH\nSALE", left: 90, top: 210, width: 640, fontSize: 170, fill: "#111111", fontWeight: 900, lineHeight: 0.95 },
      { type: "Textbox", text: "48 hours only — everything must go", left: 94, top: 560, width: 780, fontSize: 42, fill: "#292524", fontWeight: 600 },
      { type: "Rect", left: 90, top: 720, width: 380, height: 110, rx: 55, ry: 55, fill: "#111111" },
      { type: "Textbox", text: "SHOP NOW", left: 90, top: 750, width: 380, fontSize: 38, fill: "#FDE047", fontWeight: 800, textAlign: "center", letterSpacing: 20 },
      { type: "Textbox", text: "code CANVADEMO", left: 94, top: 960, width: 600, fontSize: 30, fill: "#57534E", fontWeight: 500 },
    ],
  },
  {
    title: "Strip — Web Banner Ad",
    category: "ads",
    width: 1600,
    height: 600,
    isPro: false,
    background: "#0F1220",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1600, height: 600, fill: G("#4F46E5", "#0EA5E9", 1, 1) },
      { type: "Circle", left: 1250, top: -80, width: 360, height: 360, radius: 180, fill: "#F8FAFC", opacity: 0.14 },
      { type: "Circle", left: 1090, top: 330, width: 220, height: 220, radius: 110, fill: "#F8FAFC", opacity: 0.1 },
      { type: "Textbox", text: "Design faster with AI layers", left: 100, top: 190, width: 900, fontSize: 72, fill: "#FFFFFF", fontWeight: 800 },
      { type: "Textbox", text: "Nemotron-powered layouts, one-click exports", left: 104, top: 310, width: 860, fontSize: 34, fill: "#E0E7FF", fontWeight: 400 },
      { type: "Rect", left: 100, top: 400, width: 250, height: 78, rx: 39, ry: 39, fill: "#FFFFFF" },
      { type: "Textbox", text: "Try free →", left: 100, top: 422, width: 250, fontSize: 32, fill: "#4338CA", fontWeight: 700, textAlign: "center" },
    ],
  },
  {
    title: "Podcast — Story Ad",
    category: "ads",
    width: 1080,
    height: 1350,
    isPro: true,
    background: "#14070F",
    objects: [
      { type: "Ellipse", left: -140, top: 90, width: 620, height: 620, rx: 310, ry: 310, fill: "#EC4899", opacity: 0.5 },
      { type: "Circle", left: 620, top: 330, width: 360, height: 360, radius: 180, fill: G("#8B5CF6", "#EC4899", 1, 1), opacity: 0.85 },
      { type: "Textbox", text: "EPISODE 42", left: 90, top: 610, width: 500, fontSize: 40, fill: "#F0ABFC", fontWeight: 700, letterSpacing: 40 },
      { type: "Textbox", text: "Creative\nBloom", left: 90, top: 680, width: 800, fontSize: 120, fill: "#FFF1F2", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.05 },
      { type: "Textbox", text: "On colour, craft and the memes\nthat shaped a decade", left: 90, top: 940, width: 860, fontSize: 38, fill: "#FECDD3", fontWeight: 400, lineHeight: 1.35 },
      { type: "Rect", left: 90, top: 1120, width: 340, height: 90, rx: 20, ry: 20, fill: "#EC4899" },
      { type: "Textbox", text: "Listen now", left: 90, top: 1148, width: 340, fontSize: 38, fill: "#FFFFFF", fontWeight: 700, textAlign: "center" },
    ],
  },

  /* ============================ CARDS ============================= */
  {
    title: "Minimal — Quote Card",
    category: "card",
    width: 1050,
    height: 1500,
    isPro: true,
    background: "#F1F5F9",
    objects: [
      { type: "Circle", left: 60, top: 60, width: 120, height: 120, radius: 60, fill: "#6366F1", opacity: 0.9 },
      { type: "Textbox", text: "0 4", left: 78, top: 80, width: 90, fontSize: 40, fill: "#EEF2FF", fontWeight: 700, textAlign: "center" },
      { type: "Textbox", text: "“Simplicity is\nthe ultimate\nsophistication.”", left: 120, top: 520, width: 840, fontSize: 96, fill: "#0F172A", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.18 },
      { type: "Rect", left: 124, top: 900, width: 120, height: 4, fill: "#6366F1" },
      { type: "Textbox", text: "blockquote studies", left: 124, top: 1330, width: 700, fontSize: 34, fill: "#64748B", fontWeight: 500 },
    ],
  },
  {
    title: "Bloom — Birthday Card",
    category: "card",
    width: 1050,
    height: 1500,
    isPro: false,
    background: "#14070F",
    objects: [
      { type: "Ellipse", left: -160, top: 940, width: 700, height: 700, rx: 350, ry: 350, fill: "#EC4899", opacity: 0.5 },
      { type: "Ellipse", left: 560, top: 860, width: 640, height: 640, rx: 320, ry: 320, fill: "#8B5CF6", opacity: 0.55 },
      { type: "Circle", left: 180, top: 200, width: 70, height: 70, radius: 35, fill: "#FDE047", },
      { type: "Circle", left: 800, top: 320, width: 46, height: 46, radius: 23, fill: "#FDE047", opacity: 0.7 },
      { type: "Textbox", text: "Happy\nBirthday!", left: 90, top: 420, width: 800, fontSize: 148, fill: "#F8FAFC", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.05 },
      { type: "Textbox", text: "wishing you the brightest year yet", left: 90, top: 800, width: 780, fontSize: 44, fill: "#FDE047", fontWeight: 400, fontStyle: "italic", fontFamily: "Playfair Display" },
      { type: "Rect", left: 90, top: 960, width: 870, height: 2, fill: "#F8FAFC", opacity: 0.25 },
    ],
  },
  {
    title: "Grateful — Thank You Card",
    category: "card",
    width: 1050,
    height: 1500,
    isPro: false,
    background: "#FBF7F4",
    objects: [
      { type: "Circle", left: 60, top: 60, width: 120, height: 120, radius: 60, fill: "transparent", stroke: "#F59E0B", strokeWidth: 3 },
      { type: "Circle", left: 100, top: 100, width: 40, height: 40, radius: 20, fill: "#F59E0B" },
      { type: "Textbox", text: "THANK YOU", left: 90, top: 180, width: 700, fontSize: 44, fill: "#92400E", fontWeight: 800, letterSpacing: 40 },
      { type: "Textbox", text: "for being the\nunmistakable\nreason we grow", left: 90, top: 500, width: 840, fontSize: 88, fill: "#3F2A20", fontWeight: 600, fontFamily: "Playfair Display", lineHeight: 1.2 },
      { type: "Ellipse", left: 250, top: 1090, width: 560, height: 320, rx: 280, ry: 160, fill: G("#F59E0B", "#FBBF24", 1, 0.6), opacity: 0.9 },
      { type: "Textbox", text: "warmest regards,\nthe whole team", left: 0, top: 1300, width: 1050, fontSize: 36, fill: "#78350F", fontWeight: 500, fontStyle: "italic", textAlign: "center", fontFamily: "Playfair Display" },
    ],
  },
  {
    title: "Bold — Business Card",
    category: "card",
    width: 1050,
    height: 600,
    isPro: false,
    background: "#F8FAFC",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 340, height: 600, fill: G("#0F172A", "#1E293B", 0, 1) },
      { type: "Circle", left: 110, top: 210, width: 120, height: 120, radius: 60, fill: "#22D3EE" },
      { type: "Circle", left: 130, top: 230, width: 80, height: 80, radius: 40, fill: "transparent", stroke: "#0F172A", strokeWidth: 3 },
      { type: "Textbox", text: "ALEX RIVERA", left: 400, top: 180, width: 560, fontSize: 64, fill: "#0F172A", fontWeight: 800, letterSpacing: 20 },
      { type: "Textbox", text: "Creative Director", left: 400, top: 270, width: 560, fontSize: 34, fill: "#64748B", fontWeight: 500 },
      { type: "Rect", left: 400, top: 340, width: 90, height: 4, fill: "#22D3EE" },
      { type: "Textbox", text: "hello@studio.design", left: 400, top: 430, width: 480, fontSize: 30, fill: "#0F172A", fontWeight: 500 },
      { type: "Textbox", text: "studio.design", left: 400, top: 480, width: 480, fontSize: 26, fill: "#94A3B8", fontWeight: 400 },
    ],
  },
  {
    title: "Nordic — Christmas Card",
    category: "card",
    width: 1050,
    height: 1500,
    isPro: false,
    background: "#0F2A1D",
    objects: [
      { type: "Rect", left: 60, top: 60, width: 930, height: 1380, rx: 16, ry: 16, fill: "transparent", stroke: "#D4D48A", strokeWidth: 2, opacity: 0.7 },
      { type: "Circle", left: 455, top: -160, width: 140, height: 140, radius: 70, fill: "#FDE047", opacity: 0.9 },
      { type: "Textbox", text: "GOD\nJUL", left: 0, top: 420, width: 1050, fontSize: 160, fill: "#F7FEE7", fontWeight: 800, fontFamily: "Bebas Neue", textAlign: "center", lineHeight: 0.92 },
      { type: "Textbox", text: "merry christmas, softly snowed", left: 0, top: 700, width: 1050, fontSize: 34, fill: "#D4D48A", fontWeight: 400, textAlign: "center", fontStyle: "italic" },
      { type: "Triangle", left: 380, top: 1080, width: 120, height: 150, fill: "#155E43" },
      { type: "Triangle", left: 480, top: 1080, width: 190, height: 220, fill: "#166534" },
      { type: "Rect", left: 520, top: 1300, width: 12, height: 70, fill: "#7C2D12" },
    ],
  },

  /* ============================ STORY ============================= */
  {
    title: "Studio — Sale Story",
    category: "story",
    width: 1080,
    height: 1920,
    isPro: false,
    background: "#111318",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1080, height: 1920, fill: G("#F43F5E", "#111318", 0, 1), opacity: 0.2 },
      { type: "Ellipse", left: 240, top: 560, width: 600, height: 600, rx: 300, ry: 300, fill: "#FDE047", opacity: 0.9 },
      { type: "Textbox", text: "50%", left: 0, top: 640, width: 1080, fontSize: 210, fill: "#0C0A09", fontWeight: 900, textAlign: "center" },
      { type: "Textbox", text: "OFF", left: 0, top: 900, width: 1080, fontSize: 110, fill: "#111318", fontWeight: 900, textAlign: "center" },
      { type: "Textbox", text: "studio pro bundle — today only", left: 0, top: 1180, width: 1080, fontSize: 52, fill: "#F8FAFC", fontWeight: 600, textAlign: "center" },
      { type: "Rect", left: 330, top: 1560, width: 420, height: 100, rx: 50, ry: 50, fill: "#F8FAFC" },
      { type: "Textbox", text: "Tap to shop", left: 330, top: 1588, width: 420, fontSize: 40, fill: "#F43F5E", fontWeight: 700, textAlign: "center" },
    ],
  },
  {
    title: "Drop — New Arrival Story",
    category: "story",
    width: 1080,
    height: 1920,
    isPro: false,
    background: "#0C0A09",
    objects: [
      { type: "Rect", left: 640, top: 640, width: 300, height: 300, rx: 150, ry: 150, fill: G("#F97316", "#EC4899", 1, 0.6), angle: 12 },
      { type: "Textbox", text: "NEW\nARRIVAL", left: 90, top: 260, width: 800, fontSize: 140, fill: "#FFF7ED", fontWeight: 900, lineHeight: 0.98 },
      { type: "Textbox", text: "capsule 03 — coastal heat", left: 94, top: 580, width: 720, fontSize: 40, fill: "#FDBA74", fontWeight: 500 },
      { type: "Rect", left: 90, top: 1460, width: 900, height: 2, fill: "#F8FAFC", opacity: 0.3 },
      { type: "Textbox", text: "@nexastudio   ·   nexa.shop", left: 90, top: 1560, width: 800, fontSize: 34, fill: "#A8A29E", fontWeight: 400 },
      { type: "Circle", left: 90, top: 700, width: 110, height: 110, radius: 55, fill: "transparent", stroke: "#F97316", strokeWidth: 3 },
      { type: "Textbox", text: "◉", left: 90, top: 720, width: 110, fontSize: 60, fill: "#F97316", textAlign: "center" },
    ],
  },

  /* ======================== PRESENTATION ========================== */
  {
    title: "Launch — Deck Cover",
    category: "presentation",
    width: 1600,
    height: 900,
    isPro: true,
    background: "#0B0B16",
    objects: [
      { type: "Rect", left: 0, top: 620, width: 1600, height: 280, fill: "#6366F1", opacity: 0.25 },
      { type: "Textbox", text: "Draft v2.0", left: 120, top: 220, width: 900, fontSize: 150, fill: "#F8FAFC", fontWeight: 800 },
      { type: "Textbox", text: "quarterly product launch review", left: 124, top: 440, width: 900, fontSize: 48, fill: "#A5B4FC", fontWeight: 500 },
      { type: "Circle", left: 1290, top: 180, width: 180, height: 180, radius: 90, fill: "#22D3EE", opacity: 0.9 },
      { type: "Circle", left: 1310, top: 200, width: 140, height: 140, radius: 70, fill: "transparent", stroke: "#0B0B16", strokeWidth: 2, opacity: 0.6 },
      { type: "Textbox", text: "confidential — team only", left: 120, top: 790, width: 800, fontSize: 30, fill: "#64748B", fontWeight: 400 },
    ],
  },

  /* ============================ LOGO ============================== */
  {
    title: "Bloom — Logo Mark",
    category: "logo",
    width: 1000,
    height: 1000,
    isPro: true,
    background: "#FAFAF9",
    objects: [
      { type: "Circle", left: 420, top: 140, width: 160, height: 160, radius: 80, fill: G("#EC4899", "#F97316", 0, 1) },
      { type: "Circle", left: 420, top: 700, width: 160, height: 160, radius: 80, fill: G("#8B5CF6", "#EC4899", 0, 1) },
      { type: "Ellipse", left: 250, top: 320, width: 160, height: 160, rx: 80, ry: 80, fill: "#F97316", opacity: 0.9 },
      { type: "Ellipse", left: 590, top: 320, width: 160, height: 160, rx: 80, ry: 80, fill: "#EC4899", opacity: 0.9 },
      { type: "Ellipse", left: 250, top: 520, width: 160, height: 160, rx: 80, ry: 80, fill: "#8B5CF6", opacity: 0.9 },
      { type: "Ellipse", left: 590, top: 520, width: 160, height: 160, rx: 80, ry: 80, fill: "#22D3EE", opacity: 0.9 },
      { type: "Textbox", text: "bloom.studio", left: 0, top: 880, width: 1000, fontSize: 44, fill: "#1C1917", fontWeight: 700, textAlign: "center", letterSpacing: 30 },
    ],
  },
  {
    title: "Prism — Logo Grid",
    category: "logo",
    width: 1000,
    height: 1000,
    isPro: false,
    background: "#0C0A09",
    objects: [
      { type: "Rect", left: 240, top: 240, width: 200, height: 200, rx: 24, ry: 24, fill: "#22D3EE" },
      { type: "Rect", left: 460, top: 240, width: 200, height: 200, rx: 24, ry: 24, fill: "#A855F7", opacity: 0.85 },
      { type: "Rect", left: 240, top: 460, width: 200, height: 200, rx: 24, ry: 24, fill: "#A855F7", opacity: 0.85 },
      { type: "Rect", left: 460, top: 460, width: 200, height: 200, rx: 24, ry: 24, fill: "#22D3EE" },
      { type: "Circle", left: 380, top: 380, width: 140, height: 140, radius: 70, fill: "#FDE047" },
      { type: "Textbox", text: "prism", left: 0, top: 700, width: 1000, fontSize: 56, fill: "#F8FAFC", fontWeight: 800, textAlign: "center", letterSpacing: 20 },
    ],
  },

  /* ============================ FLYER ============================= */
  {
    title: "Zine — Event Flyer",
    category: "flyer",
    width: 1240,
    height: 1660,
    isPro: false,
    background: "#F5F0E8",
    objects: [
      { type: "Rect", left: 60, top: 60, width: 1120, height: 1540, rx: 12, ry: 12, fill: "transparent", stroke: "#1C1917", strokeWidth: 3 },
      { type: "Circle", left: 470, top: 180, width: 300, height: 300, radius: 150, fill: G("#F97316", "#F5F0E8", 0, 1) },
      { type: "Textbox", text: "RISOschool", left: 0, top: 530, width: 1240, fontSize: 110, fill: "#1C1917", fontWeight: 900, textAlign: "center", fontFamily: "Bebas Neue" },
      { type: "Textbox", text: "a one-day pop-up print fair — inks, zines and type on paper", left: 170, top: 680, width: 900, fontSize: 38, fill: "#44403C", textAlign: "center", fontWeight: 500 },
      { type: "Rect", left: 170, top: 830, width: 900, height: 2, fill: "#1C1917", opacity: 0.35 },
      { type: "Textbox", text: "11 NOV — 09:00\nThe Old Bakehouse, Cork", left: 0, top: 900, width: 1240, fontSize: 44, fill: "#1C1917", fontWeight: 700, textAlign: "center", lineHeight: 1.3 },
      { type: "Rect", left: 470, top: 1120, width: 300, height: 92, rx: 46, ry: 46, fill: "#1C1917" },
      { type: "Textbox", text: "RSVP →", left: 470, top: 1146, width: 300, fontSize: 36, fill: "#F5F0E8", fontWeight: 700, textAlign: "center" },
      { type: "Textbox", text: "free entry · riso prints €5", left: 0, top: 1480, width: 1240, fontSize: 30, fill: "#78716C", textAlign: "center" },
    ],
  },
  {
    title: "Rise — Poster",
    category: "flyer",
    width: 1200,
    height: 1600,
    isPro: true,
    background: "#F7F7F5",
    objects: [
      { type: "Rect", left: 0, top: 0, width: 1200, height: 1600, fill: G("#0EA5E9", "#F7F7F5", 0, 1), opacity: 0.9 },
      { type: "Textbox", text: "START\nBEFORE\nYOU'RE\nREADY", left: 90, top: 160, width: 1020, fontSize: 130, fill: "#082F49", fontWeight: 900, fontFamily: "Bebas Neue", lineHeight: 0.98 },
      { type: "Circle", left: 90, top: 800, width: 60, height: 60, radius: 30, fill: "#0C4A6E" },
      { type: "Textbox", text: "ship small things daily — momentum beats motivation", left: 210, top: 812, width: 800, fontSize: 40, fill: "#475569", fontWeight: 500 },
      { type: "Rect", left: 90, top: 960, width: 1020, height: 2, fill: "#082F49", opacity: 0.4 },
      { type: "Textbox", text: "print & ship by nexa press", left: 90, top: 1080, width: 700, fontSize: 36, fill: "#082F49", fontWeight: 700, fontFamily: "Bebas Neue" },
      { type: "Textbox", text: "riso edition 001 — through your printer's eyes", left: 90, top: 1440, width: 950, fontSize: 28, fill: "#64748B", fontWeight: 400 },
    ],
  },
];

/* --------------------------------------------------- demo designs -- */

const demoSpecs = [templates[0], templates[4], templates[9]];

/* --------------------------------------------------- assets -------- */

const assets = [
  { type: "background", category: "gradient", title: "Aurora", url: "", meta: JSON.stringify({ colors: ["#6366F1", "#EC4899", "#22D3EE"] }) },
  { type: "background", category: "gradient", title: "Sunset", url: "", meta: JSON.stringify({ colors: ["#F43F5E", "#FBBF24", "#FDE68A"] }) },
  { type: "background", category: "gradient", title: "Mint", url: "", meta: JSON.stringify({ colors: ["#10B981", "#A7F3D0", "#F0FDF4"] }) },
  { type: "background", category: "solid", title: "Ink", url: "", meta: JSON.stringify({ colors: ["#0C0A09"] }) },
  { type: "icon", category: "abstract", title: "Blob", url: "", meta: JSON.stringify({ shape: "ellipse" }) },
  { type: "vector", category: "shapes", title: "Chevron", url: "", meta: JSON.stringify({ shape: "triangle" }) },
  { type: "vector", category: "shapes", title: "Ring", url: "", meta: JSON.stringify({ shape: "circle" }) },
];

/* ------------------------------------------------------- seed ------ */

async function main() {
  const email = "demo@nexa.studio";
  const password = await bcrypt.hash("password123", 10);
  const demo = await db.user.upsert({
    where: { email },
    update: {},
    create: { name: "Demo Designer", email, password, plan: "pro" },
  });

  await db.template.deleteMany();
  for (const t of templates) {
    const payload = canvasJson(t.background, t.objects);
    const svg = svgPreview(payload, t.width, t.height);
    await db.template.create({
      data: {
        title: t.title,
        category: t.category,
        width: t.width,
        height: t.height,
        isPro: t.isPro,
        meta: JSON.stringify(t.meta ?? {}),
        jsonPayload: payload,
        thumbnailUrl: svg ? svgToDataUrl(svg) : null,
        previewUrl: null,
      },
    });
  }

  await db.asset.deleteMany();
  for (const a of assets) await db.asset.create({ data: a });

  await db.design.deleteMany({ where: { userId: demo.id } });
  let i = 0;
  for (const spec of demoSpecs) {
    const payload = canvasJson(spec.background, spec.objects);
    const svg = svgPreview(payload, spec.width, spec.height);
    await db.design.create({
      data: {
        userId: demo.id,
        title: spec.title.replace(/ — .*$/, "") + ` draft ${++i}`,
        category: spec.category,
        width: spec.width,
        height: spec.height,
        meta: JSON.stringify(spec.meta ?? {}),
        jsonPayload: payload,
        thumbnailUrl: svg ? svgToDataUrl(svg) : null,
      },
    });
  }

  console.log("Seed complete:", {
    user: demo.email,
    templates: templates.length,
    assets: assets.length,
    videoTemplates: templates.filter((t) => t.meta?.kind === "video").length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
