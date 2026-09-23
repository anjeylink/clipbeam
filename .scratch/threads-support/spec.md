# Threads support

Download videos and images from public Threads Posts through the same paste → preview → download/share flow as X.

Glossary: see `CONTEXT.md` (Platform, Post, ResolvedMedia, ParsedMedia, Media Proxy). Decisions: `docs/adr/0001-threads-extraction-via-embed.md`, `docs/adr/0002-per-platform-suffix-allowlist.md`.

## Behaviour

- **One input.** The Platform is auto-detected from the link host. The label, placeholder and invalid-link error are Platform-neutral, and the invalid-link error shows an example of each Platform's link.
- **Accepted Threads links:** `threads.com` or `threads.net`, optional `www.`, optional scheme, in the form `/@user/post/<shortcode>` or `/t/<shortcode>`. A query string, a fragment and a trailing `/media` are ignored.
- **Share links** (`/share/<token>`, from the app's Share button): the server follows their redirect to the canonical post URL, re-checking each hop the way it does for X's t.co links. A token that doesn't redirect → `not-found`.
- **Scope:** single-media Posts only, same as X.
  - Carousel → `multi-media-unsupported`
  - text-only → `no-media`
  - deleted, private or unknown → `not-found`
  - Threads 403/429 → `rate-limited`
  - markup we can't read → `unknown`
- **Author:** taken from the fetched page, never from the pasted URL, because `/t/` links have no handle and `@user` in a link can be wrong.
- **Video:** one quality option, the progressive MP4. Its label comes from its dimensions when known, otherwise "Original" (translated). The size comes from a HEAD probe.
- **Attribution:** shows `@handle` with no Platform badge. Filenames stay `clipbeam-<handle>-<quality>`, and a video with no dimensions uses `original` as the quality.
- **Errors after detection name the Platform**, e.g. "Threads is rate-limiting requests right now". The client derives the Platform from the submitted link, so the server doesn't send it.
- **Media Proxy:** every Threads URL goes through the proxy, including the image preview. Only X images keep a raw `previewUrl`.
- **Disclaimer:** names both X Corp. and Meta Platforms, Inc.

## Extraction

1. `GET https://www.threads.com/t/<shortcode>/embed` with a neutral User-Agent.
2. Read the target post's `OuterContainerFull` block: the `HeaderLink` handle, plus `<video><source src>` or the media `<img>`.
   - More than one media element → `multi-media-unsupported`.
3. If no media is found, or the embed can't be read, fall back to `GET https://www.threads.com/t/<shortcode>` with a Googlebot User-Agent (following redirects).
   - Parse the `script[type=application/json][data-sjs]` blocks and pick the post object whose `code` equals the shortcode.
   - Map `media_type`: 1 = image, 2 = video, 8 = carousel, 19 = text.

## Out of scope

Carousels (on both Platforms), DASH quality variants and muxing, Instagram.
