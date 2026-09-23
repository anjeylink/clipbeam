import { t, type Dictionary } from "intlayer";

const ogImageContent = {
  key: "og-image",
  content: {
    alt: t({
      en: "ClipBeam — share videos and images from X (Twitter) and Threads posts",
      uk: "ClipBeam — діліться відео та зображеннями з постів X (Twitter) і Threads",
    }),
    tagline: t({
      en: "Paste a post link. Share the actual file.",
      uk: "Вставте посилання на пост. Поділіться самим файлом.",
    }),
  },
} satisfies Dictionary;

export default ogImageContent;
