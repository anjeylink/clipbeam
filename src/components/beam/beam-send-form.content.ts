import { t, type Dictionary } from "intlayer";

const beamSendFormContent = {
  key: "beam-send-form",
  content: {
    label: t({
      en: "Instagram, X or Threads post link",
      uk: "Посилання на пост Instagram, X або Threads",
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
        en: "That doesn't look like an Instagram, X (Twitter) or Threads post link. Paste a URL like https://www.instagram.com/p/ABC123, https://x.com/user/status/12345 or https://www.threads.com/@user/post/ABC123.",
        uk: "Це не схоже на посилання на пост Instagram, X (Twitter) або Threads. Вставте URL, наприклад https://www.instagram.com/p/ABC123, https://x.com/user/status/12345 або https://www.threads.com/@user/post/ABC123.",
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
