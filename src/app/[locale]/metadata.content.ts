import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const metadataContent = {
  key: "page-metadata",
  content: {
    title: t({
      en: "ClipBeam — Share X (Twitter) & Threads videos and images",
      uk: "ClipBeam — відео та зображення з X (Twitter) і Threads",
    }),
    description: t({
      en: "Paste an X (Twitter) or Threads post link, preview its video or image, and share the file straight into WhatsApp, Slack, or any app. No login needed.",
      uk: "Вставте посилання на пост X (Twitter) чи Threads, перегляньте відео або зображення й надішліть сам файл у WhatsApp, Slack чи інший застосунок. Без реєстрації.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default metadataContent;
