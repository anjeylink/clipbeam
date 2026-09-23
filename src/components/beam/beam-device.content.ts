import { t, type Dictionary } from "intlayer";

const beamDeviceContent = {
  key: "beam-device",
  content: {
    install: t({
      en: "To get links on this iPhone, tap the Share button in Safari, choose \"Add to Home Screen\", then open ClipBeam from your Home Screen and come back here via the Beam link at the bottom of the page.",
      uk: "Щоб отримувати посилання на цьому iPhone, торкніться кнопки «Поділитися» в Safari, виберіть «На початковий екран», відкрийте ClipBeam з початкового екрана й поверніться сюди через посилання Beam унизу сторінки.",
    }),
    unsupported: t({
      en: "This browser can't receive push notifications.",
      uk: "Цей браузер не може отримувати push-сповіщення.",
    }),
    denied: t({
      en: "Notifications are blocked for ClipBeam. Allow them in your device settings, then reload this page.",
      uk: "Сповіщення для ClipBeam заблоковано. Дозвольте їх у налаштуваннях пристрою й перезавантажте сторінку.",
    }),
    ready: t({
      en: "Turn on notifications to receive links you send from your computer.",
      uk: "Увімкніть сповіщення, щоб отримувати посилання, надіслані з комп'ютера.",
    }),
    enable: t({
      en: "Turn on notifications",
      uk: "Увімкнути сповіщення",
    }),
    subscribed: t({
      en: "This device receives your links. Tap a notification to open the post, then Share.",
      uk: "Цей пристрій отримує ваші посилання. Торкніться сповіщення, щоб відкрити пост, а потім «Поділитися».",
    }),
    failed: t({
      en: "Couldn't turn on notifications. Reload the page and try again.",
      uk: "Не вдалося увімкнути сповіщення. Перезавантажте сторінку та спробуйте ще раз.",
    }),
  },
} satisfies Dictionary;

export default beamDeviceContent;
