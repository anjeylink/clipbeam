import { t, type Dictionary } from "intlayer";

const isrTestPageContent = {
  key: "isr-test-page",
  content: {
    title: t({
      en: "ISR test",
      uk: "Тест ISR",
    }),
    description: t({
      en: "This page is regenerated in the background at most once every 10 seconds. Reload it: the values stay the same until the window passes, then the first request after that still gets the stale page and triggers a rebuild, and the next one gets the fresh page.",
      uk: "Ця сторінка перегенеровується у фоні не частіше ніж раз на 10 секунд. Перезавантажте її: значення не змінюються, доки не мине цей час; потім перший запит усе ще отримує застарілу сторінку й запускає перебудову, а наступний — уже свіжу.",
    }),
    generatedAt: t({
      en: "Generated at",
      uk: "Згенеровано о",
    }),
    randomNumber: t({
      en: "Random number",
      uk: "Випадкове число",
    }),
    revalidateNow: t({
      en: "Revalidate now",
      uk: "Перевалідувати зараз",
    }),
    devNote: t({
      en: "ISR only works in a production build (pnpm build && pnpm start). In dev every request renders the page from scratch.",
      uk: "ISR працює лише в продакшн-збірці (pnpm build && pnpm start). У режимі розробки сторінка рендериться заново на кожен запит.",
    }),
  },
} satisfies Dictionary;

export default isrTestPageContent;
