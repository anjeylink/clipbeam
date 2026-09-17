import { t, type Dictionary } from "intlayer";

const siteFooterContent = {
  key: "site-footer",
  content: {
    disclaimer: t({
      en: "ClipBeam is not affiliated with X Corp. For personal, fair-use sharing only — please respect the rights of the original poster.",
      uk: "ClipBeam не пов'язаний з X Corp. Лише для особистого використання в межах добросовісного використання — будь ласка, шануйте права автора оригінального поста.",
    }),
    legalNavLabel: t({
      en: "Legal",
      uk: "Правова інформація",
    }),
    links: {
      terms: t({
        en: "Terms of Use",
        uk: "Умови використання",
      }),
      privacy: t({
        en: "Privacy Policy",
        uk: "Політика конфіденційності",
      }),
      dmca: t({
        en: "DMCA",
        uk: "DMCA",
      }),
    },
  },
} satisfies Dictionary;

export default siteFooterContent;
