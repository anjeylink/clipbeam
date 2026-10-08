import { t, type Dictionary } from "intlayer";

const notFoundPageContent = {
  key: "not-found-page",
  content: {
    metaTitle: t({
      en: "Page not found — ClipBeam",
      uk: "Сторінку не знайдено — ClipBeam",
    }),
    title: t({
      en: "Page not found",
      uk: "Сторінку не знайдено",
    }),
    description: t({
      en: "This page doesn't exist, or the link that brought you here is out of date.",
      uk: "Такої сторінки не існує, або посилання, за яким ви перейшли, застаріло.",
    }),
    home: t({
      en: "Back to the home page",
      uk: "На головну сторінку",
    }),
    contact: t({
      en: "Think something should be here? Email us at",
      uk: "Вважаєте, що тут має щось бути? Напишіть нам на",
    }),
  },
} satisfies Dictionary;

export default notFoundPageContent;
