import { t, type Dictionary } from "intlayer";

const beamInstallGuideContent = {
  key: "beam-install-guide",
  content: {
    intro: t({
      en: "To get links on this iPhone, add ClipBeam to your Home Screen. iPhone only shows notifications from sites opened there.",
      uk: "Щоб отримувати посилання на цьому iPhone, додайте ClipBeam на початковий екран. iPhone показує сповіщення лише від сайтів, відкритих звідти.",
    }),
    steps: [
      t({
        en: "In Safari, tap the Share button. If you don't see it, tap ••• first.",
        uk: "У Safari торкніться кнопки «Поділитися». Якщо її не видно, спершу торкніться •••.",
      }),
      t({
        en: "Choose Add to Home Screen, then tap Add.",
        uk: "Виберіть «На початковий екран», а потім торкніться «Додати».",
      }),
      t({
        en: "Open ClipBeam from your Home Screen.",
        uk: "Відкрийте ClipBeam з початкового екрана.",
      }),
      t({
        en: "Tap Beam at the bottom of the page and turn on notifications.",
        uk: "Торкніться Beam унизу сторінки й увімкніть сповіщення.",
      }),
    ],
    requirement: t({
      en: "Needs iOS 16.4 or later.",
      uk: "Потрібна iOS 16.4 або новіша.",
    }),
  },
} satisfies Dictionary;

export default beamInstallGuideContent;
