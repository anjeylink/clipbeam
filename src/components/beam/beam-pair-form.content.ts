import { t, type Dictionary } from "intlayer";

const beamPairFormContent = {
  key: "beam-pair-form",
  content: {
    intro: t({
      en: "Enter your Beam key to pair this device. You only need to do this once per device.",
      uk: "Введіть ключ Beam, щоб під'єднати цей пристрій. Це потрібно зробити лише один раз на кожному пристрої.",
    }),
    label: t({
      en: "Beam key",
      uk: "Ключ Beam",
    }),
    submit: t({
      en: "Pair device",
      uk: "Під'єднати пристрій",
    }),
    errors: {
      invalidKey: t({
        en: "That key isn't right.",
        uk: "Ключ неправильний.",
      }),
      failed: t({
        en: "Couldn't pair right now. Check your connection and try again.",
        uk: "Зараз не вдалося під'єднати. Перевірте з'єднання та спробуйте ще раз.",
      }),
    },
  },
} satisfies Dictionary;

export default beamPairFormContent;
