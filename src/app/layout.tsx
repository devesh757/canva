import type { Metadata, Viewport } from "next";
import {
  Inter,
  Space_Grotesk,
  Playfair_Display,
  Bebas_Neue,
  Oswald,
  Pacifico,
  Dancing_Script,
  Montserrat,
} from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nexa — AI Creative Studio",
    template: "%s · Nexa Studio",
  },
  description:
    "Design anything with AI. Thumbnails, reels, cards and stories on a high-performance vector canvas powered by NVIDIA Nemotron.",
  keywords: ["design tool", "canvas", "AI copilot", "thumbnails", "creative studio"],
  authors: [{ name: "Nexa Studio" }],
  openGraph: {
    title: "Nexa — AI Creative Studio",
    description: "Design anything with AI on a high-performance vector canvas.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Prevents theme flash: runs before paint.
const themeScript = `(function(){try{var t=localStorage.getItem('nexa-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${playfair.variable} ${bebas.variable} ${oswald.variable} ${pacifico.variable} ${dancing.variable} ${montserrat.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
