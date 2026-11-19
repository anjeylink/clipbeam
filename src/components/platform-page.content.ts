import { t, type Dictionary } from "intlayer";

// Copy for the per-Platform landing pages (see PLATFORM_PAGES in
// src/lib/platform-pages.ts). Each page states what is true of that
// Platform only — link forms, quality, limits — so the three aren't the
// same text with the name swapped.
const platformPageContent = {
  key: "platform-page",
  content: {
    breadcrumbNavLabel: t({
      en: "Breadcrumb",
      uk: "Навігаційний ланцюжок",
    }),
    home: t({
      en: "Home",
      uk: "Головна",
    }),
    linksHeading: t({
      en: "Download by platform",
      uk: "Завантаження за платформою",
    }),
    pages: {
      instagram: {
        // Short name for the breadcrumb trail.
        name: t({
          en: "Instagram video downloader",
          uk: "Завантажувач відео з Instagram",
        }),
        linkLabel: t({
          en: "Download Instagram videos and Reels",
          uk: "Завантажити відео та Reels з Instagram",
        }),
        heading: t({
          en: "Download Instagram videos, Reels and photos",
          uk: "Завантажити відео, Reels і фото з Instagram",
        }),
        subtext: t({
          en: "Paste a link to a public Instagram post or Reel, preview it, then download the file or share it straight into WhatsApp, Slack, or any app.",
          uk: "Вставте посилання на публічний пост чи Reel з Instagram, перегляньте його, а тоді завантажте файл або поділіться ним напряму у WhatsApp, Slack чи будь-якому застосунку.",
        }),
        sections: [
          {
            heading: t({
              en: "Which Instagram links work",
              uk: "Які посилання Instagram підходять",
            }),
            paragraphs: [
              t({
                en: "Any link to a public post or Reel: instagram.com/p/…, instagram.com/reel/…, the same links with a username in front, and the link the Instagram app copies when you tap Share. Tracking parameters on the end are fine.",
                uk: "Будь-яке посилання на публічний пост чи Reel: instagram.com/p/…, instagram.com/reel/…, такі самі посилання з іменем користувача попереду, а також посилання, яке застосунок Instagram копіює після натискання «Поділитися». Параметри відстеження в кінці не заважають.",
              }),
            ],
          },
          {
            heading: t({
              en: "What you get",
              uk: "Що ви отримаєте",
            }),
            paragraphs: [
              t({
                en: "ClipBeam shows the video or photo first, so you know it's the right one before you save it. Instagram videos come in a single quality — the one Instagram itself serves — so there is no resolution to pick.",
                uk: "Спершу ClipBeam показує відео чи фото, тож ви бачите, що це саме воно, ще до збереження. Відео з Instagram доступні в одній якості — тій, яку віддає сам Instagram, — тому обирати роздільну здатність не потрібно.",
              }),
              t({
                en: "Download saves the file to your device. On a phone, Share hands the file itself to another app, so the person you send it to doesn't need Instagram to watch it.",
                uk: "Кнопка «Завантажити» дає змогу скачати файл на пристрій. На телефоні кнопка «Поділитися» передає сам файл в інший застосунок, тож отримувачу не потрібен Instagram, щоб його переглянути.",
              }),
            ],
          },
          {
            heading: t({
              en: "Carousels: one photo or video at a time",
              uk: "Каруселі: фото чи відео по одному",
            }),
            paragraphs: [
              t({
                en: "For a post with several photos or videos, ClipBeam shows how many there are and lets you pick each one, in the same order as on Instagram. Preview it, download or share it, then pick the next. Each photo and video is saved as its own file.",
                uk: "Якщо в пості кілька фото чи відео, ClipBeam показує, скільки їх, і дає обрати кожне в тому самому порядку, що й в Instagram. Перегляньте його, завантажте чи надішліть, а тоді оберіть наступне. Кожне фото й відео зберігається окремим файлом.",
              }),
            ],
          },
          {
            heading: t({
              en: "Save a Reel to your phone's gallery",
              uk: "Як зберегти Reel у галерею телефона",
            }),
            paragraphs: [
              t({
                en: "Open ClipBeam in your phone's browser and paste the Reel link. On iPhone, tap Share and choose Save Video to put it in Photos. Download works too, but on iPhone it puts the file in the Files app rather than Photos.",
                uk: "Відкрийте ClipBeam у браузері телефона й вставте посилання на Reel. На iPhone натисніть «Поділитися» й оберіть «Зберегти відео», щоб додати його у Фото. «Завантажити» теж працює, але на iPhone файл потрапляє в застосунок «Файли», а не у Фото.",
              }),
              t({
                en: "On Android, Download saves the video to your Downloads folder, where Google Photos and other gallery apps can find it.",
                uk: "На Android «Завантажити» зберігає відео в папку «Завантаження», де його знайдуть Google Фото та інші галереї.",
              }),
            ],
          },
          {
            heading: t({
              en: "When a link doesn't work",
              uk: "Якщо посилання не працює",
            }),
            paragraphs: [
              t({
                en: "ClipBeam only sees what anyone can see without logging in, so posts from private accounts, Stories and Highlights can't be read. Neither can a deleted post: check that the link still opens in a private browser window.",
                uk: "ClipBeam бачить лише те, що будь-хто може побачити без входу в акаунт, тож пости з приватних акаунтів, Stories та Highlights прочитати неможливо. Видалений пост теж: перевірте, чи посилання ще відкривається у приватному вікні браузера.",
              }),
              t({
                en: "If a public post fails with a message about rate limiting, Instagram is turning requests away for a moment. Wait a minute and try again.",
                uk: "Якщо публічний пост не відкривається й ви бачите повідомлення про обмеження запитів, Instagram тимчасово відхиляє звернення. Зачекайте хвилину й спробуйте ще раз.",
              }),
            ],
          },
        ],
      },
      x: {
        name: t({
          en: "Twitter video downloader",
          uk: "Завантажувач відео з Twitter",
        }),
        linkLabel: t({
          en: "Download X (Twitter) videos and GIFs",
          uk: "Завантажити відео та GIF з X (Twitter)",
        }),
        heading: t({
          en: "Download Twitter (X) videos, GIFs and images",
          uk: "Завантажити відео, GIF і зображення з Twitter (X)",
        }),
        subtext: t({
          en: "Paste a link to a post on X, pick the video quality, then download the file or share it straight into WhatsApp, Slack, or any app.",
          uk: "Вставте посилання на пост у X, оберіть якість відео, а тоді завантажте файл або поділіться ним напряму у WhatsApp, Slack чи будь-якому застосунку.",
        }),
        sections: [
          {
            heading: t({
              en: "Which X and Twitter links work",
              uk: "Які посилання X і Twitter підходять",
            }),
            paragraphs: [
              t({
                en: "Post links from x.com and twitter.com both work, including mobile.twitter.com links and t.co short links. Anything after the post number — tracking parameters, /photo/1 or /video/1 — is ignored.",
                uk: "Підходять посилання на пости і з x.com, і з twitter.com, зокрема з mobile.twitter.com та короткі посилання t.co. Усе, що йде після номера поста — параметри відстеження, /photo/1 чи /video/1, — ігнорується.",
              }),
            ],
          },
          {
            heading: t({
              en: "Choose the video quality",
              uk: "Оберіть якість відео",
            }),
            paragraphs: [
              t({
                en: "X keeps most videos in several resolutions. ClipBeam lists every one the post offers, such as 1080p, 720p or 480p, with its approximate file size, so you can take the sharpest copy or the one that fits a chat's upload limit.",
                uk: "X зберігає більшість відео в кількох роздільних здатностях. ClipBeam показує всі, які є в пості, наприклад 1080p, 720p чи 480p, разом із приблизним розміром файлу, тож можна взяти найчіткішу копію або ту, що вкладається в ліміт месенджера.",
              }),
              t({
                en: "GIFs on X are really short looping videos, so they download as an MP4 file that plays everywhere.",
                uk: "GIF у X — це насправді короткі зациклені відео, тому їх можна скачати як файл MP4, який відтворюється всюди.",
              }),
            ],
          },
          {
            heading: t({
              en: "Posts with up to four photos or videos",
              uk: "Пости, де до чотирьох фото чи відео",
            }),
            paragraphs: [
              t({
                en: "A post on X can carry up to four photos or videos. ClipBeam lists them in the post's order. Pick one, choose its quality if it's a video, then download or share it.",
                uk: "Пост у X може містити до чотирьох фото чи відео. ClipBeam показує їх у тому самому порядку, що й у пості. Оберіть потрібне, для відео виберіть якість, а тоді завантажте чи надішліть його.",
              }),
            ],
          },
          {
            heading: t({
              en: "Quote posts",
              uk: "Цитування",
            }),
            paragraphs: [
              t({
                en: "Paste a quote post that has no video or image of its own, and ClipBeam gives you the media from the post it quotes, credited to that post's author. If the quote post has its own media, you get that instead.",
                uk: "Якщо вставити цитування без власного відео чи зображення, ClipBeam дасть вам медіа з процитованого поста й укаже його автора. Якщо в цитуванні є власні медіа, ви отримаєте саме їх.",
              }),
            ],
          },
          {
            heading: t({
              en: "When a link doesn't work",
              uk: "Якщо посилання не працює",
            }),
            paragraphs: [
              t({
                en: "Posts from protected accounts can't be read, because ClipBeam only sees what's public. A deleted post won't work either, and neither will a link to a profile. A post link has /status/ followed by the post number, unless it's a t.co short link.",
                uk: "Пости із закритих акаунтів прочитати неможливо, бо ClipBeam бачить лише публічне. Не спрацює й видалений пост або посилання на профіль. У посиланні на пост є /status/ і номер поста, якщо це не коротке посилання t.co.",
              }),
            ],
          },
        ],
      },
      threads: {
        name: t({
          en: "Threads video downloader",
          uk: "Завантажувач відео з Threads",
        }),
        linkLabel: t({
          en: "Download Threads videos and images",
          uk: "Завантажити відео та зображення з Threads",
        }),
        heading: t({
          en: "Download Threads videos and images",
          uk: "Завантажити відео та зображення з Threads",
        }),
        subtext: t({
          en: "Paste a link to a public Threads post, preview it, then download the file or share it straight into WhatsApp, Slack, or any app.",
          uk: "Вставте посилання на публічний пост у Threads, перегляньте його, а тоді завантажте файл або поділіться ним напряму у WhatsApp, Slack чи будь-якому застосунку.",
        }),
        sections: [
          {
            heading: t({
              en: "Which Threads links work",
              uk: "Які посилання Threads підходять",
            }),
            paragraphs: [
              t({
                en: "Post links from threads.com and the older threads.net both work, and so does the link the Threads app copies when you tap Share.",
                uk: "Підходять посилання на пости і з threads.com, і зі старішого threads.net, а також посилання, яке застосунок Threads копіює після натискання «Поділитися».",
              }),
            ],
          },
          {
            heading: t({
              en: "What you get",
              uk: "Що ви отримаєте",
            }),
            paragraphs: [
              t({
                en: "ClipBeam shows the video or image first, then lets you download it or share the file itself. Threads serves each video in a single quality, so there's nothing to pick.",
                uk: "Спершу ClipBeam показує відео чи зображення, а тоді дає завантажити його або поділитися самим файлом. Threads віддає кожне відео в одній якості, тож обирати нічого не треба.",
              }),
            ],
          },
          {
            heading: t({
              en: "Threads posts that only link to an Instagram Reel",
              uk: "Пости Threads, які лише посилаються на Reel з Instagram",
            }),
            paragraphs: [
              t({
                en: "Some Threads posts have no video of their own: they link to an Instagram Reel and Threads plays it inline. Paste the Threads link anyway. ClipBeam follows it and gives you the Reel.",
                uk: "Деякі пости Threads не мають власного відео: вони посилаються на Reel з Instagram, а Threads відтворює його просто в стрічці. Усе одно вставляйте посилання Threads — ClipBeam перейде за ним і дасть вам скачати цей Reel.",
              }),
            ],
          },
          {
            heading: t({
              en: "Carousels and quote posts",
              uk: "Каруселі та цитування",
            }),
            paragraphs: [
              t({
                en: "A Threads post with several photos or videos shows all of them in order, and you pick one at a time. A quote post with no media of its own gives you the media from the post it quotes, credited to that post's author.",
                uk: "Пост Threads із кількома фото чи відео показує їх усі по порядку, а ви обираєте по одному. Цитування без власних медіа дає вам медіа з процитованого поста із зазначенням його автора.",
              }),
            ],
          },
          {
            heading: t({
              en: "When a link doesn't work",
              uk: "Якщо посилання не працює",
            }),
            paragraphs: [
              t({
                en: "Posts from private profiles can't be read, and neither can deleted ones. A link to a profile won't work either: copy the link of the post itself, from its Share button.",
                uk: "Пости з приватних профілів прочитати неможливо, як і видалені. Посилання на профіль теж не спрацює: скопіюйте посилання на сам пост через його кнопку «Поділитися».",
              }),
            ],
          },
        ],
      },
    },
  },
} satisfies Dictionary;

export default platformPageContent;
