import { t, type Dictionary } from "intlayer";

const urlInputFormContent = {
  key: "url-input-form",
  content: {
    label: t({
      en: "X (Twitter) post link",
      uk: "Посилання на пост X (Twitter)",
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
