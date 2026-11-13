import { t, type Dictionary } from "intlayer";

const beamPromoContent = {
  key: "beam-promo",
  content: {
    heading: t({
      en: "Found it on your computer? Share it from your phone",
      uk: "Знайшли на комп'ютері? Поділіться з телефона",
    }),
    description: t({
      en: "Beam sends a post link from your computer to your phone as a notification. Tap it and the post opens ready to share. Connect your phone once with a code, no account needed.",
      uk: "Beam надсилає посилання на пост із комп'ютера на телефон як сповіщення. Торкніться його, і пост відкриється готовим до поширення. Під'єднайте телефон один раз за допомогою коду, акаунт не потрібен.",
    }),
    cta: t({
      en: "Set up Beam",
      uk: "Налаштувати Beam",
    }),
  },
} satisfies Dictionary;

export default beamPromoContent;
