import { t, type Dictionary } from "intlayer";

const ogImageContent = {
  key: "og-image",
  content: {
    alt: t({
      en: "ClipBeam — download and share Instagram, X (Twitter) and Threads videos and images",
      uk: "ClipBeam — завантажуйте й надсилайте відео та зображення з Instagram, X (Twitter) і Threads",
    }),
    tagline: t({
      en: "Paste a post link. Download or share the file.",
      uk: "Вставте посилання на пост. Завантажте файл або поділіться ним.",
    }),
  },
} satisfies Dictionary;

export default ogImageContent;
