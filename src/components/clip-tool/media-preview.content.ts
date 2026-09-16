import { insert, t, type Dictionary } from "intlayer";

const mediaPreviewContent = {
  key: "media-preview",
  content: {
    altText: insert(
      t({
        en: "Media from @{{handle}}'s post",
        uk: "Медіа з поста @{{handle}}",
      }),
    ),
    video: t({
      en: "Video",
      uk: "Відео",
    }),
    image: t({
      en: "Image",
      uk: "Зображення",
    }),
  },
} satisfies Dictionary;

export default mediaPreviewContent;
