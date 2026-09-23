import { t, type Dictionary } from "intlayer";

const urlInputFormContent = {
  key: "url-input-form",
  content: {
    label: t({
      en: "X (Twitter) or Threads post link",
      uk: "Посилання на пост X (Twitter) або Threads",
    }),
    placeholder: t({
      en: "Paste a post link here",
      uk: "Вставте посилання на пост сюди",
    }),
    pasteAriaLabel: t({
      en: "Paste link from clipboard",
      uk: "Вставити посилання з буфера обміну",
    }),
    fetching: t({
      en: "Fetching…",
      uk: "Завантаження…",
    }),
    getMedia: t({
      en: "Get media",
      uk: "Отримати медіа",
    }),
  },
} satisfies Dictionary;

export default urlInputFormContent;
