import { t, type Dictionary } from "intlayer";

const faqContent = {
  key: "faq",
  content: {
    heading: t({
      en: "Frequently asked questions",
      uk: "Поширені запитання",
    }),
    items: [
      {
        question: t({
          en: "Which links does ClipBeam work with?",
          uk: "З якими посиланнями працює ClipBeam?",
        }),
        answer: t({
          en: "Public post links from X (Twitter) — x.com, twitter.com, and t.co short links — and from Threads, including threads.com share links.",
          uk: "З посиланнями на публічні пости X (Twitter) — x.com, twitter.com і короткими t.co — а також Threads, зокрема посиланнями «Поділитися» з threads.com.",
        }),
      },
      {
        question: t({
          en: "Do I need an account?",
          uk: "Чи потрібен акаунт?",
        }),
        answer: t({
          en: "No. ClipBeam has no sign-in, and it never asks for your X or Threads login.",
          uk: "Ні. У ClipBeam немає входу, і він ніколи не запитує ваші дані для входу в X чи Threads.",
        }),
      },
      {
        question: t({
          en: "Can I save the video to my device?",
          uk: "Чи можна зберегти відео на пристрій?",
        }),
        answer: t({
          en: "Yes. Download saves the file. On phones and browsers that support it, Share sends the file itself — not a link — to WhatsApp, Slack, or any other app.",
          uk: "Так. Кнопка «Завантажити» зберігає файл. На телефонах і в браузерах, що це підтримують, кнопка «Поділитися» надсилає сам файл, а не посилання, у WhatsApp, Slack чи інший застосунок.",
        }),
      },
      {
        question: t({
          en: "Can I choose the video quality?",
          uk: "Чи можна обрати якість відео?",
        }),
        answer: t({
          en: "For X videos, pick any resolution the post offers, such as 1080p or 720p. Threads videos come in a single quality.",
          uk: "Для відео з X оберіть будь-яку доступну в пості роздільну здатність, наприклад 1080p чи 720p. Відео з Threads доступні в одній якості.",
        }),
      },
      {
        question: t({
          en: "Does it work with private posts or posts with several images?",
          uk: "Чи працює це з приватними постами або постами з кількома зображеннями?",
        }),
        answer: t({
          en: "Not yet. ClipBeam reads public posts only, and takes one image or video per link.",
          uk: "Поки що ні. ClipBeam читає лише публічні пости й бере одне зображення чи відео з посилання.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqContent;
