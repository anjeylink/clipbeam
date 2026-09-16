import { t, type Dictionary } from "intlayer";

const localeSwitcherContent = {
  key: "locale-switcher",
  content: {
    ariaLabel: t({
      en: "Language",
      uk: "Мова",
    }),
  },
} satisfies Dictionary;

export default localeSwitcherContent;
