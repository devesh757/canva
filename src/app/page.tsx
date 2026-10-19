import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Gallery } from "@/components/landing/gallery";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <LandingNav />
      <main>
        <Hero />
        <Gallery />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
