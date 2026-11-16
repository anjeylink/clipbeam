import { t, type Dictionary } from "intlayer";

const beamPhoneCodeContent = {
  key: "beam-phone-code",
  content: {
    intro: t({
      en: "On your computer, type this code at",
      uk: "На комп'ютері введіть цей код на сторінці",
    }),
    codeLabel: t({
      en: "Connection code",
      uk: "Код під'єднання",
    }),
    hint: t({
      en: "A code works once, for 10 minutes. When the computer connects, this phone gets a notification. To connect another computer, get a new code.",
      uk: "Код діє один раз протягом 10 хвилин. Коли комп'ютер під'єднається, на цей телефон прийде сповіщення. Щоб під'єднати ще один комп'ютер, отримайте новий код.",
    }),
    newCode: t({
      en: "New code",
      uk: "Новий код",
    }),
    expired: t({
      en: "This code has expired. Get a new one.",
      uk: "Термін дії коду минув. Отримайте новий.",
    }),
    tooManyAttempts: t({
      en: "Too many codes in a row. Wait a few minutes, then try again.",
      uk: "Забагато кодів поспіль. Зачекайте кілька хвилин і спробуйте ще раз.",
    }),
    failed: t({
      en: "Couldn't get a code. Check your connection and try again.",
      uk: "Не вдалося отримати код. Перевірте з'єднання та спробуйте ще раз.",
    }),
  },
} satisfies Dictionary;

export default beamPhoneCodeContent;
