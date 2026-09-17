import { insert, t, type Dictionary } from "intlayer";

const shareActionsContent = {
  key: "share-actions",
  content: {
    share: t({
      en: "Share",
      uk: "Поділитися",
    }),
    preparing: t({
      en: "Preparing…",
      uk: "Підготовка…",
    }),
    download: t({
      en: "Download",
      uk: "Завантажити",
    }),
    retry: t({
      en: "Retry",
      uk: "Повторити",
    }),
    prepareFailed: t({
      en: "Couldn't prepare the file. Check your connection and try again.",
      uk: "Не вдалося підготувати файл. Перевірте з'єднання і спробуйте ще раз.",
    }),
    shareTitle: t({
      en: "ClipBeam",
      uk: "ClipBeam",
    }),
    shareText: insert(
      t({
        en: "Media from @{{handle}}'s post",
        uk: "Медіа з поста @{{handle}}",
      }),
    ),
    errors: {
      interrupted: t({
        en: "Sharing was interrupted. Try again, or download instead.",
        uk: "Надсилання перервано. Спробуйте ще раз або завантажте файл.",
      }),
    },
  },
} satisfies Dictionary;

export default shareActionsContent;
