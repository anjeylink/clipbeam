import { t, type Dictionary } from "intlayer";

const sendToPhoneButtonContent = {
  key: "send-to-phone-button",
  content: {
    label: t({
      en: "Send to phone",
      uk: "Надіслати на телефон",
    }),
    sent: t({
      en: "Sent to your phone. Tap the notification there, then Share.",
      uk: "Надіслано на телефон. Торкніться сповіщення на ньому, а потім «Поділитися».",
    }),
    disconnected: t({
      en: "Your phone is no longer connected to this computer.",
      uk: "Ваш телефон більше не під'єднано до цього комп'ютера.",
    }),
    reconnect: t({
      en: "Connect it again",
      uk: "Під'єднати знову",
    }),
    errors: {
      "invalid-format": t({
        en: "This post's link can't be sent to your phone.",
        uk: "Посилання на цей пост не вдається надіслати на телефон.",
      }),
      "too-many-attempts": t({
        en: "That's a lot of links in a row. Wait a minute, then send again.",
        uk: "Забагато посилань поспіль. Зачекайте хвилину й надішліть ще раз.",
      }),
      failed: t({
        en: "Couldn't send right now. Try again in a moment.",
        uk: "Зараз не вдалося надіслати. Спробуйте ще раз за мить.",
      }),
    },
  },
} satisfies Dictionary;

export default sendToPhoneButtonContent;
