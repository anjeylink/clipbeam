import { t, type Dictionary } from "intlayer";
import { CONTACT_EMAIL } from "@/lib/legal-constants";

const privacyPageContent = {
  key: "privacy-page",
  content: {
    title: t({
      en: "Privacy Policy",
      uk: "Політика конфіденційності",
    }),
    updatedAt: t({
      en: "Last updated: September 16, 2026",
      uk: "Востаннє оновлено: 16 вересня 2026 р.",
    }),
    intro: t({
      en: "This page explains what ClipBeam does — and doesn't — do with your data. We keep things minimal on purpose.",
      uk: "Ця сторінка пояснює, що ClipBeam робить — і чого не робить — із вашими даними. Ми свідомо тримаємо все мінімальним.",
    }),
    sections: [
      {
        heading: t({
          en: "What we collect",
          uk: "Що ми збираємо",
        }),
        paragraphs: [
          t({
            en: "When you paste a post link, we process that URL to retrieve the media you asked for. We also store a small first-party cookie that remembers your preferred language (English or Ukrainian) — that's it.",
            uk: "Коли ви вставляєте посилання на пост, ми обробляємо цю URL-адресу, щоб отримати медіа, яке ви запитали. Ми також зберігаємо невеликий власний файл cookie, що запам'ятовує вашу мову інтерфейсу (англійську чи українську) — і це все.",
          }),
        ],
      },
      {
        heading: t({
          en: "What we don't collect",
          uk: "Чого ми не збираємо",
        }),
        paragraphs: [
          t({
            en: "ClipBeam has no accounts or sign-in, so we don't collect names, emails, or passwords through the app itself. We don't currently store the media you download on our servers — once it's shared to your device or another app, ClipBeam doesn't keep a copy.",
            uk: "ClipBeam не має акаунтів чи входу в систему, тож ми не збираємо імена, електронні адреси чи паролі через сам застосунок. Наразі ми не зберігаємо завантажене вами медіа на наших серверах — щойно воно поширене на ваш пристрій чи в інший застосунок, ClipBeam не залишає собі копії.",
          }),
        ],
      },
      {
        heading: t({
          en: "Analytics and tracking",
          uk: "Аналітика та відстеження",
        }),
        paragraphs: [
          t({
            en: "ClipBeam doesn't currently use any analytics, advertising, or tracking services. If that ever changes, we'll update this page.",
            uk: "ClipBeam наразі не використовує жодних сервісів аналітики, реклами чи відстеження. Якщо це коли-небудь зміниться, ми оновимо цю сторінку.",
          }),
        ],
      },
      {
        heading: t({
          en: "Third-party content",
          uk: "Контент третіх осіб",
        }),
        paragraphs: [
          t({
            en: "The posts you retrieve through ClipBeam belong to their original creators, not to us. We don't claim any ownership over that content.",
            uk: "Пости, які ви отримуєте через ClipBeam, належать їхнім оригінальним авторам, а не нам. Ми не претендуємо на жодні права власності на цей контент.",
          }),
        ],
      },
      {
        heading: t({
          en: "Children's privacy",
          uk: "Конфіденційність дітей",
        }),
        paragraphs: [
          t({
            en: "ClipBeam isn't directed at children, and we don't knowingly collect data from children.",
            uk: "ClipBeam не призначений для дітей, і ми свідомо не збираємо дані від дітей.",
          }),
        ],
      },
      {
        heading: t({
          en: "Changes to this policy",
          uk: "Зміни до цієї політики",
        }),
        paragraphs: [
          t({
            en: "If we change how ClipBeam handles data, we'll update this page and revise the date above.",
            uk: "Якщо ми змінимо спосіб обробки даних у ClipBeam, ми оновимо цю сторінку та дату вище.",
          }),
        ],
      },
      {
        heading: t({
          en: "Contact",
          uk: "Контакти",
        }),
        paragraphs: [
          t({
            en: `Questions about your privacy? Reach us at ${CONTACT_EMAIL}.`,
            uk: `Маєте запитання щодо конфіденційності? Пишіть нам на ${CONTACT_EMAIL}.`,
          }),
        ],
      },
    ],
  },
} satisfies Dictionary;

export default privacyPageContent;
