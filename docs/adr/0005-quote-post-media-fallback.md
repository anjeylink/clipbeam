# A Quote Post with no media of its own resolves to the quoted post's media

ADR 0001 made a text post that quotes a video resolve to `no-media`, so that someone else's video was never handed back as the quoter's. People paste those links expecting the video they can see in the post, so that clause is reversed: when a Quote Post has no media of its own, we resolve the quoted post's Media Items instead. This supersedes only that clause of ADR 0001. Embed-first extraction and the rule that a reply's parent is ignored both stand.

- **Own media wins.** The quoted post is read only when the pasted Post has no media. A Quote Post that attaches its own image or video resolves to that, exactly as before, and the two are never merged into one carousel.
- **Credit goes to whoever made the media.** `authorHandle` is the quoted post's author, which is what the preview caption, alt text and download filename show. `postUrl` stays the pasted Post. If the source names no author for the quoted post, the pasted Post's author is used, as `linked_inline_media` already does. This is the same rule the Threads `linked_inline_media` fallback already followed, and it answers ADR 0001's concern, which was misattribution.
- **One level deep.** A quote of a quote of a video is `no-media`. None of the three sources nests a second level reliably.

Where the quoted post is read from:

- **X.** `quoted_tweet` in the syndication payload, which carries its own `user` and `mediaDetails`. The field name and shape are taken from react-tweet's published types for this endpoint, not from a captured response.
- **Threads embed.** The `QuotePostContainer` block nested in the target, up to the quoted post's own `ActionBarContainer`. If any media follows that block the embed is treated as inconclusive, because it would be the target's own and we have no capture showing where a Quote Post's own media is rendered.
- **Threads page.** `text_post_app_info.share_info.quoted_post`, which has the same Meta media shape as the post itself.

Instagram has no Quote Post. A plain repost (X retweet, Threads repost) is assumed to have no permalink of its own that people paste, so nothing was built for it. That is an inference from how both apps share links, not something we measured.

## Consequences

- The user sees a different handle under the preview than the one in the link they pasted. Nothing in the UI says the media came from a quoted post.
- A quoted post that is deleted or private yields no media and the Quote Post resolves to `no-media`.
