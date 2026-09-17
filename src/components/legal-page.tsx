import type { ReactNode } from "react";

type LegalSection = {
  heading: ReactNode;
  paragraphs: ReactNode[];
};

type LegalPageProps = {
  title: ReactNode;
  updatedAt: ReactNode;
  intro?: ReactNode;
  sections: LegalSection[];
};

export function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  return (
    <article className="w-full px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{updatedAt}</p>
          {intro ? (
            <p className="text-sm leading-relaxed sm:text-base">{intro}</p>
          ) : null}
        </header>
        {sections.map((section, index) => (
          <section key={index} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-sm leading-relaxed sm:text-base">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
