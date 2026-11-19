import { t, type Dictionary } from "intlayer";

const beamPageContent = {
  key: "beam-page",
  content: {
    title: t({
      en: "Beam: send posts from your computer to your phone",
      uk: "Beam: надсилайте пости з комп'ютера на телефон",
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
    sections: [
      {
        heading: t({
          en: "How Beam works",
          uk: "Як працює Beam",
        }),
        paragraphs: [
          t({
            en: "Paste an Instagram, X or Threads link on your computer and press Send to phone. A moment later your phone shows a notification. Tap it and ClipBeam opens with the post already loaded, so one more tap on Share sends the video or image to WhatsApp, Slack, or any other app.",
            uk: "Вставте посилання з Instagram, X чи Threads на комп'ютері й натисніть «Надіслати на телефон». За мить телефон покаже сповіщення. Торкніться його, і ClipBeam відкриється з уже завантаженим постом, тож ще одне натискання «Поділитися» надішле відео чи зображення у WhatsApp, Slack чи будь-який інший застосунок.",
          }),
          t({
            en: "It's for the moment you find a clip on your laptop but want to send it from your phone. No emailing links to yourself, and no moving files between devices.",
            uk: "Це для випадків, коли ви знайшли відео на ноутбуці, а надіслати хочете з телефона. Не треба пересилати посилання собі на пошту чи переносити файли між пристроями.",
          }),
        ],
      },
      {
        heading: t({
          en: "One code, and you're set",
          uk: "Один код, і все налаштовано",
        }),
        paragraphs: [
          t({
            en: "Open this page on your phone and turn on notifications. The phone then shows a 6-digit code. Type it on your computer and the two are connected: the phone gets a notification to confirm it, and the computer stays connected from then on.",
            uk: "Відкрийте цю сторінку на телефоні й увімкніть сповіщення. Після цього телефон покаже 6-значний код. Введіть його на комп'ютері, і пристрої з'єднаються: телефон отримає сповіщення-підтвердження, а комп'ютер залишатиметься під'єднаним і надалі.",
          }),
          t({
            en: "A code works once and expires after 10 minutes. You can connect several computers to the same phone, each with a new code.",
            uk: "Код діє один раз і впродовж 10 хвилин. До одного телефона можна під'єднати кілька комп'ютерів, кожен із новим кодом.",
          }),
        ],
      },
      {
        heading: t({
          en: "What you need",
          uk: "Що для цього потрібно",
        }),
        paragraphs: [
          t({
            en: "On iPhone, Beam works from the Home Screen: add ClipBeam there from Safari first, because iPhone only shows notifications from sites opened that way. It needs iOS 16.4 or later. On Android, a browser that supports notifications, such as Chrome, is enough. The computer only needs a web browser.",
            uk: "На iPhone Beam працює з початкового екрана: спершу додайте туди ClipBeam із Safari, бо iPhone показує сповіщення лише від сайтів, відкритих у такий спосіб. Потрібна iOS 16.4 або новіша. На Android достатньо браузера, що підтримує сповіщення, наприклад Chrome. Комп'ютеру потрібен лише браузер.",
          }),
        ],
      },
      {
        heading: t({
          en: "No account, and only the link travels",
          uk: "Без акаунта, і передається лише посилання",
        }),
        paragraphs: [
          t({
            en: "Beam has no sign-up. Your phone is known by a random ID kept in a cookie, and to reach it ClipBeam keeps just two things: the notification address your browser gives it and the language you use. A phone that goes a year without getting a link or opening Beam is forgotten.",
            uk: "У Beam немає реєстрації. Телефон ідентифікується випадковим ID, що зберігається в cookie, а щоб до нього достукатися, ClipBeam зберігає лише дві речі: адресу для сповіщень, яку надає ваш браузер, і мову, якою ви користуєтеся. Телефон, який рік не отримував посилань і не відкривав Beam, забувається.",
          }),
          t({
            en: "A Beam carries only the post link, never the video itself: your phone fetches the media when you open it. To stop sending, press Disconnect phone on the computer. To stop receiving, turn off notifications for ClipBeam on the phone.",
            uk: "Beam передає лише посилання на пост, а не саме відео: телефон завантажує медіа, коли ви його відкриваєте. Щоб припинити надсилання, натисніть «Від'єднати телефон» на комп'ютері. Щоб припинити отримання, вимкніть сповіщення від ClipBeam на телефоні.",
          }),
        ],
      },
    ],
  },
} satisfies Dictionary;

export default beamPageContent;
