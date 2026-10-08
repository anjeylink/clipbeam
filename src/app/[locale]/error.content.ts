import { t, type Dictionary } from "intlayer";

const errorPageContent = {
  key: "error-page",
  content: {
    metaTitle: t({
      en: "Something went wrong — ClipBeam",
      uk: "Щось пішло не так — ClipBeam",
    }),
    title: t({
      en: "Something went wrong",
      uk: "Щось пішло не так",
    }),
    description: t({
      en: "The page failed to load. Trying again usually fixes it.",
      uk: "Не вдалося завантажити сторінку. Зазвичай допомагає повторна спроба.",
    }),
    retry: t({
      en: "Try again",
      uk: "Спробувати ще раз",
    }),
    home: t({
      en: "Back to the home page",
      uk: "На головну сторінку",
    }),
    contact: t({
      en: "Still broken? Email us at",
      uk: "Досі не працює? Напишіть нам на",
    }),
  },
} satisfies Dictionary;

export default errorPageContent;
