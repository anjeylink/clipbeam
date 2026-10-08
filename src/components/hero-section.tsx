import type { ReactNode } from "react";
import { ClipTool } from "@/components/clip-tool/clip-tool";

type HeroSectionProps = {
  heading: ReactNode;
  subtext: ReactNode;
};

export function HeroSection({ heading, subtext }: HeroSectionProps) {
  return (
    <section className="w-full px-4 py-12 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {heading}
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground">{subtext}</p>
        </div>
        <ClipTool />
      </div>
    </section>
  );
}
