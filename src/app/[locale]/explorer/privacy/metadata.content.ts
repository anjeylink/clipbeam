import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const privacyPageMetadata = {
  key: "privacy-page-metadata",
  content: {
    title: t({
      en: "Privacy Policy — ClipBeam",
      uk: "Політика конфіденційності — ClipBeam",
    }),
    description: t({
      en: "What ClipBeam does and doesn't do with your data.",
      uk: "Що ClipBeam робить і чого не робить із вашими даними.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default privacyPageMetadata;
