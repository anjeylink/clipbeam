import { ClipTool } from "@/components/clip-tool/clip-tool";

export function HeroSection() {
  return (
    <section className="w-full px-4 py-12 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Get the video or image out of any X post
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground">
            Paste a link, preview it instantly, and share the actual file straight
            into WhatsApp, Slack, or wherever you chat — no link-dropping required.
          </p>
        </div>
        <ClipTool />
      </div>
    </section>
  );
}
