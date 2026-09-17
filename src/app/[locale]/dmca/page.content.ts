import { t, type Dictionary } from "intlayer";
import { CONTACT_EMAIL } from "@/lib/legal-constants";

const dmcaPageContent = {
  key: "dmca-page",
  content: {
    title: t({
      en: "DMCA / Copyright Policy",
      uk: "Політика DMCA / авторських прав",
    }),
    updatedAt: t({
      en: "Last updated: September 16, 2026",
      uk: "Востаннє оновлено: 16 вересня 2026 р.",
    }),
    intro: t({
      en: "ClipBeam respects the rights of content creators and responds to valid copyright takedown requests.",
      uk: "ClipBeam поважає права авторів контенту та реагує на обґрунтовані запити щодо видалення матеріалів за порушення авторських прав.",
    }),
    sections: [
      {
        heading: t({
          en: "Our policy",
          uk: "Наша політика",
        }),
        paragraphs: [
          t({
            en: "We don't tolerate copyright infringement. If you believe content accessed through ClipBeam infringes your copyright, you can send us a takedown notice using the process below.",
            uk: "Ми не толеруємо порушення авторських прав. Якщо ви вважаєте, що контент, доступний через ClipBeam, порушує ваші авторські права, ви можете надіслати нам запит на видалення, скориставшись процесом нижче.",
          }),
        ],
      },
      {
        heading: t({
          en: "We don't host content",
          uk: "Ми не розміщуємо контент",
        }),
        paragraphs: [
          t({
            en: "ClipBeam doesn't store or host a library of media. It retrieves video and images directly from the public post you link to, at the moment you ask for it.",
            uk: "ClipBeam не зберігає та не розміщує бібліотеку медіафайлів. Він отримує відео та зображення напряму з публічного посту, на який ви посилаєтесь, у момент вашого запиту.",
          }),
        ],
      },
      {
        heading: t({
          en: "How to submit a takedown notice",
          uk: "Як подати запит на видалення",
        }),
        paragraphs: [
          t({
            en: `Email ${CONTACT_EMAIL} with: (1) the URL of the post in question, (2) a description of the copyrighted work you believe is being infringed, (3) your contact information, (4) a statement that you have a good-faith belief the use isn't authorized, and (5) your signature (physical or electronic).`,
            uk: `Надішліть листа на ${CONTACT_EMAIL} із зазначенням: (1) URL-адреси відповідного посту, (2) опису об'єкта авторського права, який, на вашу думку, порушується, (3) ваших контактних даних, (4) заяви про сумлінну переконаність у неправомірності використання та (5) вашого підпису (фізичного чи електронного).`,
          }),
        ],
      },
      {
        heading: t({
          en: "Counter-notices",
          uk: "Зустрічні повідомлення",
        }),
        paragraphs: [
          t({
            en: `If you believe a takedown request was made in error, you can reply to the same address with an explanation and we'll review it.`,
            uk: `Якщо ви вважаєте, що запит на видалення був поданий помилково, ви можете відповісти на ту саму адресу з поясненням, і ми розглянемо це.`,
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
            en: `For all copyright-related requests, reach us at ${CONTACT_EMAIL}.`,
            uk: `З усіх питань щодо авторських прав звертайтесь до нас на ${CONTACT_EMAIL}.`,
          }),
        ],
      },
    ],
  },
} satisfies Dictionary;

export default dmcaPageContent;
