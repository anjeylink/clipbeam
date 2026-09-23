# Threads media is scraped from the public embed page, with a crawler-UA page fallback

Threads has no endpoint that returns another user's public Post media without auth: the official Threads API only reads your own (or tester) posts without Meta's advanced-access review, oEmbed returns just a blockquote, and the web GraphQL endpoint needs rotating `doc_id`/`lsd` tokens. So we fetch `https://www.threads.com/t/<shortcode>/embed` with a neutral server User-Agent and read the author and the single `<video><source>`/`<img>` out of the target post's `OuterContainerFull` block (a reply's embed also renders its parent as context, and a quote post nests the quoted post as another `OuterContainerFull … OuterContainerQuotePost` block inside `QuotePostContainer` — both must be ignored, or a text post quoting a video would hand back someone else's video). Only when the embed has no media or can't be read do we fall back to the full post page fetched with a Googlebot User-Agent, whose server-rendered `data-sjs` JSON carries `media_type`, dimensions and `carousel_media`; there we pick the item whose `code` equals the requested shortcode, since the page also contains replies. We chose embed-first over richer page-JSON-first because the crawler-UA path is the most ToS-sensitive and the most likely to be shut off.

## Consequences

- Embed-sourced videos carry no dimensions and no poster, so their single quality option is labelled "Original" and the player shows the first frame instead of a poster.
- Only the progressive MP4 (video with audio) is offered; Threads' higher-quality DASH renditions are video-only and would need server-side muxing.
- Media URLs are signed and expire after about a day (`oe=` param), so they are never cached beyond the resolve call.
- Unverified risks: Meta may block datacenter IPs or start verifying Googlebot via reverse DNS. If the fallback dies, embed-only still covers single-media posts.
