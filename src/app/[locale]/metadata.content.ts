import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const metadataContent = {
  key: "page-metadata",
  content: {
    title: t({
      en: "ClipBeam — Download & share Instagram, X and Threads videos",
      uk: "ClipBeam — завантажити відео з Instagram, X і Threads",
    }),
    description: t({
      en: "Download videos and images from Instagram, X (Twitter) and Threads posts, or share the file straight into WhatsApp, Slack, or any app. Free, no login.",
      uk: "Завантажуйте відео та зображення з постів Instagram, X (Twitter) і Threads або надсилайте сам файл у WhatsApp, Slack чи інший застосунок. Безкоштовно, без реєстрації.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default metadataContent;
