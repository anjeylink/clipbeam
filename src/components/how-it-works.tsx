import { Link2, ShieldCheck, Share2 } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";

const STEP_ICONS = [Link2, ShieldCheck, Share2];

export function HowItWorks() {
  const content = useIntlayer("how-it-works");

  return (
    <section className="w-full px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {content.heading}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {content.steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <Card key={index}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {content.stepLabel({ n: index + 1 })}
                    </span>
                  </div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
