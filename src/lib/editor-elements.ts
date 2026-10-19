// Element library for the editor: photos, shapes and icon paths.

export interface ElementIcon {
  id: string;
  label: string;
  path: string; // 24x24 svg path data (addable as a fabric Path)
}

export const ELEMENT_ICONS: ElementIcon[] = [
  {
    id: "star",
    label: "Star",
    // 5-point star
    path: "M12 1.5 L15.1 8.6 L22.5 9.4 L17 14.6 L18.6 22 L12 18 L5.4 22 L7 14.6 L1.5 9.4 L8.9 8.6 Z",
  },
  {
    id: "heart",
    label: "Heart",
    path: "M12 21.35 L10.55 20.03 C5.4 15.36 2 12.28 2 8.5 C2 5.42 4.42 3 7.5 3 C9.24 3 10.91 3.81 12 5.09 C13.09 3.81 14.76 3 16.5 3 C19.58 3 22 5.42 22 8.5 C22 12.28 18.6 15.36 13.45 20.03 Z",
  },
  {
    id: "bolt",
    label: "Bolt",
    path: "M13 2 L4.5 13.5 L10.5 13.5 L10 22 L19.5 10 L13 10 Z",
  },
  {
    id: "check",
    label: "Check",
    path: "M4 12.5 L9.5 18 L20 6.5 L17.8 4.3 L9.5 13.6 L6.2 10.3 Z",
  },
  {
    id: "arrow",
    label: "Arrow",
    path: "M4 10.8 L14.8 10.8 L10.6 6.6 L13 4.2 L21 12 L13 20 L10.6 17.6 L14.8 13.2 L4 13.2 Z",
  },
  {
    id: "spark",
    label: "Sparkle",
    path: "M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z M19 16 L20 19 L23 20 L20 21 L19 24 L18 21 L15 20 L18 19 Z",
  },
];

export const ELEMENT_SHAPE_OPTS: { shape: string; label: string }[] = [
  { shape: "rect", label: "Square" },
  { shape: "pill", label: "Pill" },
  { shape: "circle", label: "Circle" },
  { shape: "triangle", label: "Triangle" },
  { shape: "ellipse", label: "Ellipse" },
  { shape: "ring", label: "Ring" },
  { shape: "line", label: "Line" },
];

export const SWATCHES = [
  "#F43F5E",
  "#F97316",
  "#FDE047",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#6366F1",
  "#A855F7",
  "#EC4899",
  "#0F172A",
  "#F8FAFC",
  "#78716C",
];

export interface ElementPhoto {
  id: string;
  label: string;
  url: string;
  thumbUrl: string;
}

function picsum(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const PHOTO_SEEDS = [
  "nexa-mountains", "nexa-city", "nexa-coffee", "nexa-desk", "nexa-blossom",
  "nexa-ocean", "nexa-street", "nexa-forest", "nexa-studio", "nexa-dunes",
  "nexa-aurora", "nexa-tulips", "nexa-market", "nexa-workshop", "nexa-hippo",
  "nexa-skyline", "nexa-lantern", "nexa-brick", "nexa-coast", "nexa-meeting",
  "nexa-lake", "nexa-laptop", "nexa-garden", "nexa-neon",
];

export const ELEMENT_PHOTOS: ElementPhoto[] = PHOTO_SEEDS.map((seed) => ({
  id: seed,
  label: seed.replace("nexa-", ""),
  url: picsum(seed, 1200, 900),
  thumbUrl: picsum(seed, 300, 225),
}));
