# Instagram media is read from the public embed page, with a crawler-UA page fallback, like Threads

Instagram has no unauthenticated API for another account's public Post media either. The Graph API only covers your own or business accounts. `?__a=1` now needs a login. The web GraphQL endpoint (`/graphql/query` with a hardcoded `doc_id` and app id) works logged-out, but its tokens rotate and Meta throttles it hard from datacenter IPs. So we reuse the approach of ADR 0001:

- **Embed first.** Fetch `https://www.instagram.com/p/<code>/embed/captioned/` with a neutral server User-Agent.
  - Videos and carousels come as "rich" embeds. Their `PolarisEmbedSimple` init data has a JSON-encoded `contextJSON` whose `shortcode_media` holds `video_url`, `dimensions`, `display_url` and `owner.username`.
  - Images come as "simple" embeds with `contextJSON: null`. Their media is the `<img class="EmbeddedMediaImage">` srcset (up to about 1440px).
  - The `Embed` element's `data-media-type` (`GraphImage` / `GraphVideo` / `GraphSidecar`) tells which case applies.
- **Page fallback.** Only when the embed is inconclusive, fetch the post page with a Googlebot User-Agent. Its server-rendered `data-sjs` JSON has the same media shape as the Threads page (`media_type`, `video_versions`, `image_versions2`, `carousel_media`), so the two Platforms share one mapper.
  - The page also repeats the post in the author's timeline with only a 640px thumbnail. So a node counts only if its `code` matches and it carries media.

We chose embed-first over GraphQL-first for the same reason as with Threads: no tokens to rotate, and the crawler-UA path, which is the most ToS-sensitive, stays a fallback. Instagram's CDN hosts are the same Meta edges as Threads' (`*.fbcdn.net`, `*.cdninstagram.com`). Instagram still gets its own allowlist entry (ADR 0002), so a Post's URLs are checked against its own Platform.

## Consequences

- Videos have one progressive-MP4 quality, labelled from the embed's dimensions. Higher DASH renditions would need muxing.
- Media URLs are signed and expire (`oe=` param), so, as with Threads, everything is proxied and nothing is cached beyond the resolve call.
- A missing or deleted Post renders a broken-media embed and surfaces as `not-found`. Private and age-gated Posts are assumed to render the same (unverified).
- Unverified risk: the probes behind this ADR ran from a residential IP. Meta may block Vercel's datacenter IPs for the embed, the crawler-UA page, or both.
- Share links (`/share/…`) redirect only for non-browser User-Agents; a browser UA gets a JS page. `resolveShortLink`'s bare HEAD relies on that.
