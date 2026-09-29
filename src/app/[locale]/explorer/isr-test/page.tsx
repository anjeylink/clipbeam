import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { useIntlayer } from "next-intlayer";

// Serve the prerendered page and rebuild it in the background at most once
// every 10 seconds. force-static is needed because useIntlayer reads request
// headers, which would otherwise opt the page into per-request rendering.
export const dynamic = "force-static";
export const revalidate = 10;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// On-demand ISR: drops the cached page for every locale, so the next request
// renders it fresh.
async function revalidateNow() {
  "use server";
  revalidatePath("/[locale]/explorer/isr-test", "page");
}

// Stands in for a data fetch: whatever it returns is frozen into the cached
// page until the next regeneration.
function renderSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    randomNumber: Math.floor(Math.random() * 1_000_000),
  };
}

export default function IsrTestPage() {
  const content = useIntlayer("isr-test-page");
  const { generatedAt, randomNumber } = renderSnapshot();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">{content.title}</h1>
      <p className="text-sm opacity-80">{content.description}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-sm">
        <dt>{content.generatedAt}</dt>
        <dd>{generatedAt}</dd>
        <dt>{content.randomNumber}</dt>
        <dd>{randomNumber}</dd>
      </dl>
      <form action={revalidateNow}>
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">
          {content.revalidateNow}
        </button>
      </form>
      <p className="text-xs opacity-60">{content.devNote}</p>
    </main>
  );
}
