import { t, type Dictionary } from "intlayer";

const beamPageContent = {
  key: "beam-page",
  content: {
    title: t({
      en: "Beam",
      uk: "Beam",
    }),
    intro: t({
      en: "Paste a post link on your computer and get it on your phone, ready to share.",
      uk: "Вставте посилання на пост на комп'ютері й отримайте його на телефоні, готовим до поширення.",
    }),
    sendHeading: t({
      en: "Send a post to your phone",
      uk: "Надіслати пост на телефон",
    }),
    deviceHeading: t({
      en: "Receive on this device",
      uk: "Отримувати на цьому пристрої",
    }),
  },
} satisfies Dictionary;

export default beamPageContent;
