import { insert, t, type Dictionary } from "intlayer";

const mediaItemPickerContent = {
  key: "media-item-picker",
  content: {
    legend: insert(
      t({
        en: "Choose media ({{count}} in this post)",
        uk: "Оберіть медіа (у цьому пості: {{count}})",
      }),
    ),
    image: insert(
      t({
        en: "Image {{position}} of {{count}}",
        uk: "Зображення {{position}} з {{count}}",
      }),
    ),
    video: insert(
      t({
        en: "Video {{position}} of {{count}}",
        uk: "Відео {{position}} з {{count}}",
      }),
    ),
  },
} satisfies Dictionary;

export default mediaItemPickerContent;
