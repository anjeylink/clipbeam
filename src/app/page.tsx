import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { FeatureBullets } from "@/components/feature-bullets";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <HowItWorks />
        <FeatureBullets />
      </main>
      <SiteFooter />
    </div>
  );
}
