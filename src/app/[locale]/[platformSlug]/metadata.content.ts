import { t, type Dictionary } from "intlayer";

const platformPageMetadata = {
  key: "platform-page-metadata",
  content: {
    instagram: {
      title: t({
        en: "Download Instagram videos, Reels and photos — ClipBeam",
        uk: "Завантажити відео, Reels і фото з Instagram — ClipBeam",
      }),
      description: t({
        en: "Free Instagram video downloader: paste a public post or Reel link, preview it, and download the video or photo, or share the file to any app. No login.",
        uk: "Безкоштовний завантажувач відео з Instagram: вставте посилання на публічний пост чи Reel, перегляньте й завантажте відео чи фото або надішліть файл у будь-який застосунок. Без реєстрації.",
      }),
    },
    x: {
      title: t({
        en: "Download Twitter (X) videos, GIFs and images — ClipBeam",
        uk: "Завантажити відео, GIF і зображення з Twitter (X) — ClipBeam",
      }),
      description: t({
        en: "Free Twitter video downloader: paste an x.com or twitter.com post link, pick 1080p, 720p or another quality, and download the video, GIF or image. No login.",
        uk: "Безкоштовний завантажувач відео з Twitter: вставте посилання на пост з x.com чи twitter.com, оберіть 1080p, 720p чи іншу якість і завантажте відео, GIF або зображення. Без реєстрації.",
      }),
    },
    threads: {
      title: t({
        en: "Download Threads videos and images — ClipBeam",
        uk: "Завантажити відео та зображення з Threads — ClipBeam",
      }),
      description: t({
        en: "Free Threads video downloader: paste a threads.com post link, preview it, and download the video or image, or share the file to any app. No login.",
        uk: "Безкоштовний завантажувач відео з Threads: вставте посилання на пост з threads.com, перегляньте й завантажте відео чи зображення або надішліть файл у будь-який застосунок. Без реєстрації.",
      }),
    },
  },
} satisfies Dictionary;

export default platformPageMetadata;
