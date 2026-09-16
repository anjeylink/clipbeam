import { useIntlayer } from "next-intlayer";

export function SiteFooter() {
  const content = useIntlayer("site-footer");

  return (
    <footer className="mt-auto w-full border-t border-border px-4 py-6">
      <div className="mx-auto max-w-5xl text-center text-xs text-muted-foreground">
        <p>{content.disclaimer}</p>
      </div>
    </footer>
  );
}
