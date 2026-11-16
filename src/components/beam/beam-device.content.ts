import { t, type Dictionary } from "intlayer";

const beamDeviceContent = {
  key: "beam-device",
  content: {
    unsupported: t({
      en: "This browser can't receive push notifications.",
      uk: "Цей браузер не може отримувати push-сповіщення.",
    }),
    denied: t({
      en: "Notifications are blocked for ClipBeam. Allow them in your device settings, then reload this page.",
      uk: "Сповіщення для ClipBeam заблоковано. Дозвольте їх у налаштуваннях пристрою й перезавантажте сторінку.",
    }),
    ready: t({
      en: "Turn on notifications to receive links you send from your computer. This phone then shows a code to type on the computer.",
      uk: "Увімкніть сповіщення, щоб отримувати посилання, надіслані з комп'ютера. Потім телефон покаже код, який треба ввести на комп'ютері.",
    }),
    enable: t({
      en: "Turn on notifications",
      uk: "Увімкнути сповіщення",
    }),
    failed: t({
      en: "Couldn't turn on notifications. Reload the page and try again.",
      uk: "Не вдалося увімкнути сповіщення. Перезавантажте сторінку та спробуйте ще раз.",
    }),
  },
} satisfies Dictionary;

export default beamDeviceContent;
