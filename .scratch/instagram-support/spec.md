# Instagram support

Download videos and images from public Instagram Posts (including Reels) through the same paste → preview → download/share flow as X and Threads, and say plainly in the site's copy that all three Platforms are supported.

Glossary: see `CONTEXT.md` (Platform, Post, ResolvedMedia, ParsedMedia, Media Proxy). Decisions: `docs/adr/0004-instagram-extraction-via-embed.md` (extraction), `docs/adr/0002-per-platform-suffix-allowlist.md` (allowlist).

## Behaviour

- **One input.** Instagram is detected from the link host like the other Platforms.
- **Accepted Instagram links:** `instagram.com` (optional `www.` or `m.`, optional scheme) or `instagr.am`, in the forms `/p/<code>`, `/reel/<code>`, `/reels/<code>`, `/tv/<code>`, and the same with a username segment in front (`/<user>/p/<code>`, `/<user>/reel/<code>`). A query string (`?igsh=…`, `?img_index=…`), a fragment and a trailing slash are ignored.
- **Share links** (`instagram.com/share/<token>`, `/share/p/<token>`, `/share/reel/<token>`): the server follows their redirect to the canonical post URL, re-checking each hop the same way it does for X's t.co and Threads' `/share/` links. If the token doesn't redirect → `not-found` (a made-up token answers 200). Verified 2026-09-24 with a real token: a HEAD with a non-browser User-Agent gets a 302 to `/reel/<code>/?igsh=…`, while a browser User-Agent gets a 200 JS page.
- **Out of scope:** Stories, Highlights, profiles, audio pages (`/reels/audio/…`), and anything that needs a login.
- **Scope:** single-media Posts only, same as X and Threads.
  - Carousel (`GraphSidecar` / `media_type` 8) → `multi-media-unsupported`
  - Unavailable → `not-found`. A missing or deleted post renders `EmbedBrokenMedia`. Private and age-gated posts are assumed to do the same (unverified).
  - Instagram 403/429, or a redirect to the login page → `rate-limited`
  - Markup we can't read → `unknown`
- **Author:** the post owner's username from the fetched page, never from the pasted link. For collab posts, that's the owner, not the co-author.
- **Video:** one quality option, the progressive MP4. Unlike Threads, the embed gives dimensions, so the label comes from them (e.g. "720p"). The size comes from a HEAD probe. The poster is the post's display image.
- **Media Proxy:** Instagram has its own allowlist entry with the same Meta CDN suffixes as Threads (`.fbcdn.net`, `.cdninstagram.com`). Every Instagram URL is proxied, including the image preview and the video poster.
- **A Threads Post that only links an Instagram Reel** still resolves as a Threads Post, as it does today.
- **Errors after detection name the Platform** ("Instagram is rate-limiting requests right now").

## Extraction

1. `GET https://www.instagram.com/p/<code>/embed/captioned/` with the neutral `ClipBeam/1.0` User-Agent (works for Reels too).
   - A `class="EmbedBrokenMedia"` block → `not-found`.
   - The `class="Embed"` element's `data-media-type` is `GraphImage`, `GraphVideo` or `GraphSidecar`. `GraphSidecar` → `multi-media-unsupported`.
   - Rich embeds (videos, carousels) carry `PolarisEmbedSimple` init data whose `contextJSON` is a JSON-encoded string: `gql_data.shortcode_media` has `__typename`, `shortcode` (must equal the requested code), `owner.username`, `dimensions`, `display_url`, and `video_url` for videos.
   - Simple embeds (images) have `contextJSON: null`. Read the image from the `<img class="EmbeddedMediaImage">` srcset, taking the widest entry and falling back to `src`, and the author from the first `class="UsernameText"`. Never read the header avatar `<img>`.
   - Anything else (e.g. a video embed without `contextJSON`) is inconclusive → fall back.
2. Fallback: `GET https://www.instagram.com/p/<code>/` with a Googlebot User-Agent. Parse the `script[type=application/json][data-sjs]` blocks and pick the object whose `code` equals the shortcode **and** that carries media (`image_versions2`, `video_versions` or `carousel_media`). The author's timeline lists the same post again with only a 640px `display_uri`, and that node must never be picked. `media_type`: 1 = image, 2 = video, 8 = carousel. This is the same shape as the Threads page JSON, so the mapping is shared.

## Copy (en + uk, order always Instagram, X (Twitter), Threads)

- Title `ClipBeam — Share Instagram, X & Threads videos and images` (uk: `ClipBeam — відео та зображення з Instagram, X і Threads`). The description names "Instagram, X (Twitter) or Threads".
- The hero, OG image, feature bullet, FAQ (links, account, quality), input label and Beam send form all name the three Platforms.
- The invalid-link errors (clip tool and Beam) show one example link per Platform, Instagram first.
- The footer disclaimer is unchanged: Meta Platforms, Inc. already covers Instagram.

## Out of scope

Carousels on any Platform, Stories/Highlights, DASH quality variants and muxing, logged-in extraction.
