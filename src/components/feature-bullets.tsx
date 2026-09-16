import { Check } from "lucide-react";

const FEATURES = [
  "Works with X (Twitter) posts — more sources coming later",
  "No account or login needed",
  "Nothing is stored after you leave the page",
  "One image or video per link for now",
];

export function FeatureBullets() {
  return (
    <section className="w-full px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
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
