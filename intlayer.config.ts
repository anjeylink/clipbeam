import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.ENGLISH, Locales.UKRAINIAN],
    defaultLocale: Locales.ENGLISH,
  },
  routing: {
    mode: "prefix-no-default",
    // "auto" (the default) ignores the saved locale cookie while `next dev`
    // is running and re-detects from Accept-Language on every request to "/",
    // which makes the locale switcher's choice get overridden immediately.
    // Force full (storage-driven) behavior in dev too, matching production.
    enableProxy: true,
  },
};

export default config;
