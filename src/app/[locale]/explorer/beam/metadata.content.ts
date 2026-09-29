import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const beamPageMetadata = {
  key: "beam-page-metadata",
  content: {
    title: t({
      en: "Beam — ClipBeam",
      uk: "Beam — ClipBeam",
    }),
    description: t({
      en: "Send a post from your computer to your phone.",
      uk: "Надішліть пост із комп'ютера на телефон.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default beamPageMetadata;
