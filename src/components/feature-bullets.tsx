import { Check } from "lucide-react";
import { useIntlayer } from "next-intlayer";

export function FeatureBullets() {
  const content = useIntlayer("feature-bullets");

  return (
    <section className="w-full px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {content.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
