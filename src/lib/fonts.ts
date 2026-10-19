// Font pack loaded via next/font in layout.tsx.
// `css` values are the CSS variable the font is attached to; canvas uses the
// real family name (document.fonts has it once the page loads).
export interface EditorFont {
  name: string;
  family: string; // actual font-family name for fabric objects
  cssVar?: string; // next/font variable
  weights: number[];
  kind: "sans" | "serif" | "display" | "script" | "mono";
}

export const EDITOR_FONTS: EditorFont[] = [
  { name: "Inter", family: "Inter", cssVar: "--font-sans", weights: [300, 400, 500, 600, 700, 800], kind: "sans" },
  { name: "Space Grotesk", family: "Space Grotesk", cssVar: "--font-display", weights: [400, 500, 600, 700], kind: "display" },
  { name: "Playfair Display", family: "Playfair Display", cssVar: "--font-playfair", weights: [400, 500, 600, 700], kind: "serif" },
  { name: "Bebas Neue", family: "Bebas Neue", cssVar: "--font-bebas", weights: [400, 700], kind: "display" },
  { name: "Oswald", family: "Oswald", cssVar: "--font-oswald", weights: [300, 400, 500, 700], kind: "display" },
  { name: "Pacifico", family: "Pacifico", cssVar: "--font-pacifico", weights: [400], kind: "script" },
  { name: "Dancing Script", family: "Dancing Script", cssVar: "--font-dancing", weights: [400, 700], kind: "script" },
  { name: "Montserrat", family: "Montserrat", cssVar: "--font-montserrat", weights: [300, 400, 600, 800], kind: "sans" },
  { name: "Courier New", family: "Courier New", weights: [400, 700], kind: "mono" },
  { name: "Georgia", family: "Georgia", weights: [400, 700], kind: "serif" },
  { name: "Impact", family: "Impact", weights: [400], kind: "display" },
  { name: "Verdana", family: "Verdana", weights: [400, 700], kind: "sans" },
];

export function fontByFamily(family: string): EditorFont {
  return EDITOR_FONTS.find((f) => f.family === family) ?? EDITOR_FONTS[0];
}
