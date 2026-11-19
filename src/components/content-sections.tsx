import type { ReactNode } from "react";

type ContentSection = { heading: ReactNode; paragraphs: ReactNode[] };

export function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <article className="w-full px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
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
