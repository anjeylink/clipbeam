import { t, type Dictionary } from "intlayer";

const beamSendFormContent = {
  key: "beam-send-form",
  content: {
    label: t({
      en: "X or Threads post link",
      uk: "Посилання на пост X або Threads",
    }),
    placeholder: t({
      en: "https://x.com/user/status/…",
      uk: "https://x.com/user/status/…",
    }),
    pasteAriaLabel: t({
      en: "Paste from clipboard",
      uk: "Вставити з буфера обміну",
    }),
    submit: t({
      en: "Send to phone",
      uk: "Надіслати на телефон",
    }),
    sent: t({
      en: "Sent. Tap the notification on your phone, then Share.",
      uk: "Надіслано. Торкніться сповіщення на телефоні, а потім «Поділитися».",
    }),
    errors: {
      invalidFormat: t({
        en: "That doesn't look like an X (Twitter) or Threads post link.",
        uk: "Це не схоже на посилання на пост X (Twitter) або Threads.",
      }),
      noDevice: t({
        en: "No phone is set up yet. Open Beam in the ClipBeam Home Screen app on your phone and turn on notifications.",
        uk: "Телефон ще не налаштовано. Відкрийте Beam у застосунку ClipBeam на головному екрані телефона та увімкніть сповіщення.",
      }),
      failed: t({
        en: "Couldn't send right now. Try again in a moment.",
        uk: "Зараз не вдалося надіслати. Спробуйте ще раз за мить.",
      }),
    },
  },
} satisfies Dictionary;

export default beamSendFormContent;
