import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const metadataContent = {
  key: "page-metadata",
  content: {
    title: t({
      en: "ClipBeam — Share video & images, natively",
      uk: "ClipBeam — Діліться відео та зображеннями напряму",
    }),
    description: t({
      en: "Paste a post link, preview the video or image, and share it straight into WhatsApp, Slack, or any app — no link-dropping required.",
      uk: "Вставте посилання на пост, перегляньте відео чи зображення та поділіться ним напряму у WhatsApp, Slack чи будь-якому іншому застосунку — без пересилання самого посилання.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default metadataContent;
