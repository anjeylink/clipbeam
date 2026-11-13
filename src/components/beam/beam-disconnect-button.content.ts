import { t, type Dictionary } from "intlayer";

const beamDisconnectButtonContent = {
  key: "beam-disconnect-button",
  content: {
    hint: t({
      en: "This computer is connected to your phone. Disconnecting only affects this computer.",
      uk: "Цей комп'ютер під'єднано до вашого телефона. Від'єднання стосується лише цього комп'ютера.",
    }),
    label: t({
      en: "Disconnect phone",
      uk: "Від'єднати телефон",
    }),
    failed: t({
      en: "Couldn't disconnect. Try again.",
      uk: "Не вдалося від'єднати. Спробуйте ще раз.",
    }),
  },
} satisfies Dictionary;

export default beamDisconnectButtonContent;
