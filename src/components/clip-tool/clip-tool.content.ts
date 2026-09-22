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
      "not-found": t({
        en: "That post couldn't be found. It may have been deleted or the link may be wrong.",
        uk: "Цей пост не знайдено. Можливо, його видалено, або посилання неправильне.",
      }),
      "unsupported-post": t({
        en: "Couldn't read that post. It may be private, deleted, or unsupported.",
        uk: "Не вдалося прочитати цей пост. Можливо, він приватний, видалений або не підтримується.",
      }),
      "no-media": t({
        en: "That post doesn't have an image or video to grab.",
        uk: "У цьому пості немає зображення чи відео для завантаження.",
      }),
      "multi-media-unsupported": t({
        en: "Posts with multiple photos aren't supported yet — try a post with a single image or video.",
        uk: "Пости з кількома фото поки не підтримуються — спробуйте пост з одним зображенням або відео.",
      }),
      "unsupported-media-host": t({
        en: "That post's media couldn't be verified as safe to fetch. Try a different post.",
        uk: "Не вдалося підтвердити, що медіа цього поста безпечне для завантаження. Спробуйте інший пост.",
      }),
      "rate-limited": t({
        en: "X is rate-limiting requests right now. Wait a moment and try again.",
        uk: "X зараз обмежує кількість запитів. Зачекайте трохи і спробуйте ще раз.",
      }),
      unknown: t({
        en: "Something went wrong.",
        uk: "Щось пішло не так.",
      }),
    },
  },
} satisfies Dictionary;

export default clipToolContent;
