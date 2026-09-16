import { t, type Dictionary } from "intlayer";

const heroSectionContent = {
  key: "hero-section",
  content: {
    heading: t({
      en: "Get the video or image out of any post",
      uk: "Отримайте відео чи зображення з будь-якого поста",
    }),
    subtext: t({
      en: "Paste a link, preview it instantly, and share the actual file straight into WhatsApp, Slack, or wherever you chat — no link-dropping required.",
      uk: "Вставте посилання, миттєво перегляньте вміст і поділіться самим файлом напряму у WhatsApp, Slack чи будь-якому месенджері — без пересилання самого посилання.",
    }),
  },
} satisfies Dictionary;

export default heroSectionContent;
