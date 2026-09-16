import { Link2, ShieldCheck, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    icon: Link2,
    title: "Paste the link",
    description: "Copy any X (Twitter) post link and drop it into the box above.",
  },
  {
    icon: ShieldCheck,
    title: "Preview & pick quality",
    description: "See the video or image right away and choose a resolution if it's a video.",
  },
  {
    icon: Share2,
    title: "Share the file",
    description: "Send it straight into WhatsApp, Slack, or any app's share sheet — not just a link.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <step.icon className="size-5 text-primary" aria-hidden="true" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
