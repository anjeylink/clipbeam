import { t, type Dictionary } from "intlayer";

// Shown by the service worker on the phone.
const beamNotificationContent = {
  key: "beam-notification",
  content: {
    // The body is the post URL.
    post: {
      title: t({
        en: "Ready to share",
        uk: "Готово до поширення",
      }),
    },
    connected: {
      title: t({
        en: "Connected to a computer",
        uk: "Під'єднано до комп'ютера",
      }),
      body: t({
        en: "Links you send from it will show up here.",
        uk: "Посилання, які ви з нього надішлете, з'являтимуться тут.",
      }),
    },
  },
} satisfies Dictionary;

export default beamNotificationContent;
