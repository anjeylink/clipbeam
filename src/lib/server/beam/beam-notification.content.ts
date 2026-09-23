import { t, type Dictionary } from "intlayer";

// Shown by the service worker on the phone; the body is the post URL.
const beamNotificationContent = {
  key: "beam-notification",
  content: {
    title: t({
      en: "Ready to share",
      uk: "Готово до поширення",
    }),
  },
} satisfies Dictionary;

export default beamNotificationContent;
