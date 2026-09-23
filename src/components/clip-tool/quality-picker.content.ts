import { insert, t, type Dictionary } from "intlayer";

const qualityPickerContent = {
  key: "quality-picker",
  content: {
    legend: t({
      en: "Video quality",
      uk: "Якість відео",
    }),
    // Shown when the Platform didn't report the video's dimensions.
    original: t({
      en: "Original",
      uk: "Оригінал",
    }),
    approxSize: insert(
      t({
        en: "~{{mb}} MB",
        uk: "~{{mb}} МБ",
      }),
    ),
  },
} satisfies Dictionary;

export default qualityPickerContent;
