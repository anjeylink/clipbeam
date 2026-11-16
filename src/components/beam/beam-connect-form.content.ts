import { t, type Dictionary } from "intlayer";

const beamConnectFormContent = {
  key: "beam-connect-form",
  content: {
    label: t({
      en: "Code from your phone",
      uk: "Код із телефона",
    }),
    submit: t({
      en: "Connect",
      uk: "Під'єднати",
    }),
    phoneGone: t({
      en: "Your phone stopped receiving links, so this computer was disconnected. Get a new code on your phone to connect again.",
      uk: "Ваш телефон перестав отримувати посилання, тому цей комп'ютер від'єднано. Отримайте новий код на телефоні, щоб під'єднатися знову.",
    }),
    errors: {
      invalidCode: t({
        en: "That code isn't right or has expired. Get a new one on your phone.",
        uk: "Код неправильний або його термін дії минув. Отримайте новий на телефоні.",
      }),
      noDevice: t({
        en: "Your phone isn't receiving notifications any more. Open Beam on it, turn them on again, then use the new code.",
        uk: "Ваш телефон більше не отримує сповіщення. Відкрийте на ньому Beam, знову увімкніть їх і введіть новий код.",
      }),
      tooManyAttempts: t({
        en: "Too many tries. Wait a few minutes, then try again.",
        uk: "Забагато спроб. Зачекайте кілька хвилин і спробуйте ще раз.",
      }),
      failed: t({
        en: "Couldn't connect right now. Check your connection and try again.",
        uk: "Зараз не вдалося під'єднатися. Перевірте з'єднання та спробуйте ще раз.",
      }),
    },
  },
} satisfies Dictionary;

export default beamConnectFormContent;
