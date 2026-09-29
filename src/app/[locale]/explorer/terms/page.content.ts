import { t, type Dictionary } from "intlayer";
import { CONTACT_EMAIL } from "@/lib/legal-constants";

const termsPageContent = {
  key: "terms-page",
  content: {
    title: t({
      en: "Terms of Use",
      uk: "Умови використання",
    }),
    updatedAt: t({
      en: "Last updated: September 16, 2026",
      uk: "Востаннє оновлено: 16 вересня 2026 р.",
    }),
    intro: t({
      en: "ClipBeam is a small tool that lets you paste a public post link and share its video or image directly into apps like WhatsApp or Slack. By using ClipBeam, you agree to these terms.",
      uk: "ClipBeam — невеликий інструмент, який дозволяє вставити посилання на публічний пост і поділитися його відео чи зображенням напряму в застосунках на кшталт WhatsApp чи Slack. Користуючись ClipBeam, ви погоджуєтесь із цими умовами.",
    }),
    sections: [
      {
        heading: t({
          en: "Acceptable use",
          uk: "Належне використання",
        }),
        paragraphs: [
          t({
            en: "Use ClipBeam only for lawful purposes. Don't use it to harass, defame, or infringe on anyone's rights, and don't try to abuse, overload, or reverse-engineer the service.",
            uk: "Використовуйте ClipBeam лише в законних цілях. Не використовуйте його для переслідування, наклепу чи порушення чиїхось прав, а також не намагайтеся зловживати сервісом, перевантажувати його чи здійснювати зворотну розробку.",
          }),
        ],
      },
      {
        heading: t({
          en: "Your responsibility for content you download",
          uk: "Ваша відповідальність за завантажений контент",
        }),
        paragraphs: [
          t({
            en: "ClipBeam helps you retrieve media from public posts, but it doesn't grant you any rights to that media. You are responsible for making sure you have the right to save, use, or redistribute anything you download — for example, permission from the original creator, or a genuine fair-use case.",
            uk: "ClipBeam допомагає отримати медіа з публічних постів, але не надає жодних прав на цей контент. Ви самі відповідаєте за те, щоб мати право зберігати, використовувати чи поширювати все, що завантажуєте — наприклад, дозвіл автора оригіналу або обґрунтований випадок добросовісного використання.",
          }),
        ],
      },
      {
        heading: t({
          en: "\"As is\", no warranty",
          uk: "«Як є», без гарантій",
        }),
        paragraphs: [
          t({
            en: "ClipBeam is provided \"as is\", without any warranty of any kind. We don't guarantee the service will always be available, accurate, or error-free.",
            uk: "ClipBeam надається «як є», без будь-яких гарантій. Ми не гарантуємо, що сервіс завжди буде доступним, точним чи безпомилковим.",
          }),
        ],
      },
      {
        heading: t({
          en: "Limitation of liability",
          uk: "Обмеження відповідальності",
        }),
        paragraphs: [
          t({
            en: "To the fullest extent permitted by law, ClipBeam and its operators are not liable for any damages arising from your use of the service, including any consequences of downloading or sharing content through it.",
            uk: "Максимально дозволеною законом мірою ClipBeam та його оператори не несуть відповідальності за будь-які збитки, що виникають унаслідок використання сервісу, зокрема за наслідки завантаження чи поширення контенту через нього.",
          }),
        ],
      },
      {
        heading: t({
          en: "Changes to the service",
          uk: "Зміни в сервісі",
        }),
        paragraphs: [
          t({
            en: "We may change, suspend, or discontinue any part of ClipBeam at any time, and we may update these terms as the service evolves. Continued use after a change means you accept the updated terms.",
            uk: "Ми можемо змінювати, призупиняти чи припиняти роботу будь-якої частини ClipBeam у будь-який час, а також оновлювати ці умови в міру розвитку сервісу. Продовження використання після зміни означає, що ви приймаєте оновлені умови.",
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
            en: `Questions about these terms? Reach us at ${CONTACT_EMAIL}.`,
            uk: `Маєте запитання щодо цих умов? Пишіть нам на ${CONTACT_EMAIL}.`,
          }),
        ],
      },
    ],
  },
} satisfies Dictionary;

export default termsPageContent;
