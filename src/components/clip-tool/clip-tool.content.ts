import { insert, t, type Dictionary } from "intlayer";

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
        en: "That doesn't look like an X (Twitter) or Threads post link. Paste a URL like https://x.com/user/status/12345 or https://www.threads.com/@user/post/ABC123.",
        uk: "Це не схоже на посилання на пост X (Twitter) або Threads. Вставте URL, наприклад https://x.com/user/status/12345 або https://www.threads.com/@user/post/ABC123.",
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
        en: "Posts with multiple photos or videos aren't supported yet — try a post with a single image or video.",
        uk: "Пости з кількома фото чи відео поки не підтримуються — спробуйте пост з одним зображенням або відео.",
      }),
      "unsupported-media-host": t({
        en: "That post's media couldn't be verified as safe to fetch. Try a different post.",
        uk: "Не вдалося підтвердити, що медіа цього поста безпечне для завантаження. Спробуйте інший пост.",
      }),
      "rate-limited": t({
        en: "The site is rate-limiting requests right now. Wait a moment and try again.",
        uk: "Сайт зараз обмежує кількість запитів. Зачекайте трохи і спробуйте ще раз.",
      }),
      unknown: t({
        en: "Something went wrong.",
        uk: "Щось пішло не так.",
      }),
    },
    // Used instead of `errors` once the link's Platform is known, so the
    // message names it ({{platform}} is a brand name: X or Threads).
    platformErrors: {
      "not-found": insert(
        t({
          en: "That post couldn't be found on {{platform}}. It may have been deleted or the link may be wrong.",
          uk: "Цей пост не знайдено в {{platform}}. Можливо, його видалено, або посилання неправильне.",
        }),
      ),
      "unsupported-post": insert(
        t({
          en: "Couldn't read that {{platform}} post. It may be private, deleted, or unsupported.",
          uk: "Не вдалося прочитати цей пост {{platform}}. Можливо, він приватний, видалений або не підтримується.",
        }),
      ),
      "rate-limited": insert(
        t({
          en: "{{platform}} is rate-limiting requests right now. Wait a moment and try again.",
          uk: "{{platform}} зараз обмежує кількість запитів. Зачекайте трохи і спробуйте ще раз.",
        }),
      ),
    },
  },
} satisfies Dictionary;

export default clipToolContent;
