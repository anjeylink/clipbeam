import { insert, t, type Dictionary } from "intlayer";

const howItWorksContent = {
  key: "how-it-works",
  content: {
    heading: t({
      en: "How it works",
      uk: "Як це працює",
    }),
    stepLabel: insert(
      t({
        en: "Step {{n}}",
        uk: "Крок {{n}}",
      }),
    ),
    steps: [
      {
        title: t({
          en: "Paste the link",
          uk: "Вставте посилання",
        }),
        description: t({
          en: "Copy the post link and drop it into the box above.",
          uk: "Скопіюйте посилання на пост і вставте його у поле вище.",
        }),
      },
      {
        title: t({
          en: "Preview & pick quality",
          uk: "Перегляньте та оберіть якість",
        }),
        description: t({
          en: "See the video or image right away and choose a resolution if it's a video.",
          uk: "Одразу перегляньте відео чи зображення та оберіть роздільну здатність, якщо це відео.",
        }),
      },
      {
        title: t({
          en: "Share the file",
          uk: "Поділіться файлом",
        }),
        description: t({
          en: "Send it straight into WhatsApp, Slack, or any app's share sheet — not just a link.",
          uk: "Надішліть його напряму у WhatsApp, Slack чи через меню «Поділитися» будь-якого застосунку — не лише посилання.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default howItWorksContent;
