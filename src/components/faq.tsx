import { useIntlayer } from "next-intlayer";

export function Faq() {
  const content = useIntlayer("faq");

  return (
    <section className="w-full px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {content.heading}
        </h2>
        <div className="flex flex-col gap-6">
          {content.items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <h3 className="font-medium">{item.question}</h3>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
