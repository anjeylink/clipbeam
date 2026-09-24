import { t, type Dictionary } from "intlayer";

const heroSectionContent = {
  key: "hero-section",
  content: {
    heading: t({
      en: "Share videos and images from Instagram, X (Twitter) and Threads posts",
      uk: "Діліться відео та зображеннями з постів Instagram, X (Twitter) і Threads",
    }),
    subtext: t({
      en: "Paste a link, preview it instantly, and share the actual file straight into WhatsApp, Slack, or wherever you chat — no link-dropping required.",
      uk: "Вставте посилання, миттєво перегляньте вміст і поділіться самим файлом напряму у WhatsApp, Slack чи будь-якому месенджері — без пересилання самого посилання.",
    }),
  },
} satisfies Dictionary;

export default heroSectionContent;
