import { t, type Dictionary } from "intlayer";

const featureBulletsContent = {
  key: "feature-bullets",
  content: {
    features: [
      t({
        en: "Works with Instagram, X (Twitter) and Threads post links",
        uk: "Працює з посиланнями на пости Instagram, X (Twitter) і Threads",
      }),
      t({
        en: "No account or login needed",
        uk: "Не потрібен акаунт чи вхід",
      }),
      t({
        en: "Nothing is stored after you leave the page",
        uk: "Нічого не зберігається після того, як ви покинете сторінку",
      }),
      t({
        en: "Posts with several photos or videos: pick the one you want",
        uk: "Пости з кількома фото чи відео: оберіть потрібне",
      }),
    ],
  },
} satisfies Dictionary;

export default featureBulletsContent;
