import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const beamPageMetadata = {
  key: "beam-page-metadata",
  content: {
    title: t({
      en: "Beam: send a post from your computer to your phone — ClipBeam",
      uk: "Beam: надішліть пост із комп'ютера на телефон — ClipBeam",
    }),
    description: t({
      en: "Paste an Instagram, X or Threads link on your computer and get it on your phone as a notification, ready to share. Free, no account.",
      uk: "Вставте посилання з Instagram, X чи Threads на комп'ютері й отримайте його на телефоні як сповіщення, готовим до поширення. Безкоштовно, без акаунта.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default beamPageMetadata;
