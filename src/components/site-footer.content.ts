import { t, type Dictionary } from "intlayer";

const siteFooterContent = {
  key: "site-footer",
  content: {
    disclaimer: t({
      en: "ClipBeam is not affiliated with X Corp. For personal, fair-use sharing only — please respect the rights of the original poster.",
      uk: "ClipBeam не пов'язаний з X Corp. Лише для особистого використання в межах добросовісного використання — будь ласка, шануйте права автора оригінального поста.",
    }),
  },
} satisfies Dictionary;

export default siteFooterContent;
