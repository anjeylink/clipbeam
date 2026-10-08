import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL } from "@/lib/legal-constants";

type StatusPageProps = {
  code?: string;
  title: ReactNode;
  description: ReactNode;
  // The lead-in to the contact address, e.g. "Email us at".
  contact: ReactNode;
  // The page's actions: links or buttons.
  children: ReactNode;
};

export function StatusPage({
  code,
  title,
  description,
  contact,
  children,
}: StatusPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            {code ? (
              <p className="font-mono text-sm font-medium text-primary">{code}</p>
            ) : null}
            <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-balance text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {children}
          </div>
          <p className="text-sm text-muted-foreground">
            {contact}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
