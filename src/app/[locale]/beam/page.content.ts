import { t, type Dictionary } from "intlayer";

const beamPageContent = {
  key: "beam-page",
  content: {
    title: t({
      en: "Beam",
      uk: "Beam",
    }),
    intro: t({
      en: "Paste a post link on your computer and get it on your phone, ready to share. No account needed: connect your phone once with a code.",
      uk: "Вставте посилання на пост на комп'ютері й отримайте його на телефоні, готовим до поширення. Акаунт не потрібен: під'єднайте телефон один раз за допомогою коду.",
    }),
    sendHeading: t({
      en: "Send a post to your phone",
      uk: "Надіслати пост на телефон",
    }),
    computer: {
      heading: t({
        en: "Connect your phone",
        uk: "Під'єднайте телефон",
      }),
      openOnPhone: t({
        en: "On your phone, open",
        uk: "На телефоні відкрийте",
      }),
      steps: [
        t({
          en: "On iPhone, add ClipBeam to your Home Screen first. The page there shows you how.",
          uk: "На iPhone спершу додайте ClipBeam на початковий екран. Сторінка на телефоні покаже, як це зробити.",
        }),
        t({
          en: "Turn on notifications. Your phone then shows a 6-digit code.",
          uk: "Увімкніть сповіщення. Після цього телефон покаже 6-значний код.",
        }),
        t({
          en: "Type the code below.",
          uk: "Введіть код нижче.",
        }),
      ],
    },
    phone: {
      heading: t({
        en: "Get links on this phone",
        uk: "Отримуйте посилання на цьому телефоні",
      }),
    },
    switchToPhone: t({
      en: "Using a phone? Set it up to receive links.",
      uk: "Ви з телефона? Налаштуйте його для отримання посилань.",
    }),
    switchToComputer: t({
      en: "On a computer? Connect it to your phone.",
      uk: "Ви з комп'ютера? Під'єднайте його до телефона.",
    }),
  },
} satisfies Dictionary;

export default beamPageContent;
