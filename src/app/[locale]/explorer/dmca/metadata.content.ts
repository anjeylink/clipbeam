import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const dmcaPageMetadata = {
  key: "dmca-page-metadata",
  content: {
    title: t({
      en: "DMCA / Copyright Policy — ClipBeam",
      uk: "Політика DMCA / авторських прав — ClipBeam",
    }),
    description: t({
      en: "How to submit a copyright takedown notice for content accessed through ClipBeam.",
      uk: "Як подати запит на видалення матеріалів за порушення авторських прав щодо контенту, доступного через ClipBeam.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default dmcaPageMetadata;
