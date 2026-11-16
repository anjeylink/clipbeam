import { useIntlayer } from "next-intlayer";

// iPhone only delivers Web Push to a site added to the Home Screen (iOS
// 16.4+), and opened from there.
export function BeamInstallGuide() {
  const content = useIntlayer("beam-install-guide");

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>{content.intro}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {content.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <p className="text-muted-foreground">{content.requirement}</p>
    </div>
  );
}
