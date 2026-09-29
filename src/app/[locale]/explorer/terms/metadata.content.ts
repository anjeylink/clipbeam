import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const termsPageMetadata = {
  key: "terms-page-metadata",
  content: {
    title: t({
      en: "Terms of Use — ClipBeam",
      uk: "Умови використання — ClipBeam",
    }),
    description: t({
      en: "The terms that apply when you use ClipBeam to share video and images from public posts.",
      uk: "Умови, що застосовуються при використанні ClipBeam для поширення відео та зображень із публічних постів.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default termsPageMetadata;
