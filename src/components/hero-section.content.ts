import { t, type Dictionary } from "intlayer";

const heroSectionContent = {
  key: "hero-section",
  content: {
    heading: t({
      en: "Download and share Instagram, X (Twitter) and Threads videos and images",
      uk: "Завантажуйте й надсилайте відео та зображення з Instagram, X (Twitter) і Threads",
    }),
    subtext: t({
      en: "Paste a link, preview it instantly, then download the file or share it straight into WhatsApp, Slack, or wherever you chat — no link-dropping required.",
      uk: "Вставте посилання, миттєво перегляньте вміст, а тоді завантажте файл або поділіться ним напряму у WhatsApp, Slack чи будь-якому месенджері — без пересилання самого посилання.",
    }),
  },
} satisfies Dictionary;

export default heroSectionContent;
