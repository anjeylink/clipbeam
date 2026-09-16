import { t, type Dictionary } from "intlayer";

const clipToolContent = {
  key: "clip-tool",
  content: {
    loadingPreview: t({
      en: "Loading preview…",
      uk: "Завантаження перегляду…",
    }),
    previewReady: t({
      en: "Preview ready",
      uk: "Перегляд готовий",
    }),
    previewHeading: t({
      en: "Preview",
      uk: "Перегляд",
    }),
    errors: {
      "invalid-format": t({
        en: "That doesn't look like an X (Twitter) post link. Paste a URL like https://x.com/user/status/12345.",
        uk: "Це не схоже на посилання на пост X (Twitter). Вставте URL, наприклад https://x.com/user/status/12345.",
      }),
      "unsupported-post": t({
        en: "Couldn't read that post. It may be private, deleted, or unsupported.",
        uk: "Не вдалося прочитати цей пост. Можливо, він приватний, видалений або не підтримується.",
      }),
      unknown: t({
        en: "Something went wrong.",
        uk: "Щось пішло не так.",
      }),
    },
  },
} satisfies Dictionary;

export default clipToolContent;
