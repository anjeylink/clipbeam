import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapThreadsEmbedToMedia } from "./map-threads-embed";
import { MediaResolutionError } from "./media-resolution-error";
import type { ResolvedMedia } from "./resolved-media";

// Real /t/<shortcode>/embed responses (scripts and styles stripped),
// captured 2026-09-23.
function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__/threads", `embed-${name}.html`), "utf8");
}

function errorCode(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (err) {
    if (err instanceof MediaResolutionError) return err.code;
    throw err;
  }
  return undefined;
}

// The raw URL of a post expected to hold exactly one item.
function soleUrl(media: ResolvedMedia | null): string {
  expect(media?.items).toHaveLength(1);
  const item = media!.items[0];
  return item.kind === "video" ? item.qualities[0].url : item.imageUrl;
}

describe("mapThreadsEmbedToMedia", () => {
  it("maps a single-video post to one unlabelled quality with no poster", () => {
    const media = mapThreadsEmbedToMedia(fixture("video"), "DcwLClnmOrR");
    expect(media).toEqual({
      platform: "threads",
      authorHandle: "zuck",
      postUrl: "https://www.threads.com/@zuck/post/DcwLClnmOrR",
      items: [
        {
          kind: "video",
          qualities: [
            {
              label: null,
              width: 0,
              height: 0,
              approxSizeMb: 0,
              url: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\/.+\.mp4\?/),
            },
          ],
        },
      ],
    });
  });

  it("decodes HTML entities in media URLs", () => {
    const media = mapThreadsEmbedToMedia(fixture("video"), "DcwLClnmOrR");
    expect(soleUrl(media)).not.toContain("&amp;");
    expect(soleUrl(media)).toContain("&");
  });

  it("maps a single-image post to its media image, not the author avatar", () => {
    const media = mapThreadsEmbedToMedia(fixture("image"), "Dcy_A8pGo-m");
    expect(media).toMatchObject({
      platform: "threads",
      authorHandle: "zuck",
      items: [{ kind: "image" }],
    });
    expect(soleUrl(media)).toContain("/t51.82787-15/");
    expect(soleUrl(media)).not.toContain("/t51.82787-19/");
  });

  it("reads only the requested reply, not the parent post rendered above it", () => {
    const media = mapThreadsEmbedToMedia(fixture("reply-video"), "DctzKbqgOUy");
    expect(media).toMatchObject({ authorHandle: "zuck", items: [{ kind: "video" }] });
    expect(media?.items).toHaveLength(1);
  });

  describe("a Quote Post", () => {
    const QUOTE_CONTAINER = '<div class="QuotePostContainer">';
    const OWN_IMAGE =
      '<div class="SoloMediaContainer"><img src="https://scontent.cdninstagram.com/own.jpg" /></div>';
    // The fixture's quoter and quoted author are both "instagram"; renaming
    // the quoted one (the last author link) shows which handle is read.
    function quoteFixture(): string {
      const html = fixture("quote-of-video");
      const authorLink = 'class="HeaderLink"><span>instagram</span>';
      const last = html.lastIndexOf(authorLink);
      return (
        html.slice(0, last) +
        'class="HeaderLink"><span>benshelton</span>' +
        html.slice(last + authorLink.length)
      );
    }

    it("maps a text post quoting a video to the quoted video, credited to its author", () => {
      const media = mapThreadsEmbedToMedia(quoteFixture(), "DdHp9gDkmnV");
      expect(media).toMatchObject({
        platform: "threads",
        authorHandle: "benshelton",
        postUrl: "https://www.threads.com/@instagram/post/DdHp9gDkmnV",
        items: [{ kind: "video" }],
      });
      expect(soleUrl(media)).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
    });

    it("prefers the quoting post's own media over the quoted post's", () => {
      const html = quoteFixture().replace(QUOTE_CONTAINER, OWN_IMAGE + QUOTE_CONTAINER);
      const media = mapThreadsEmbedToMedia(html, "DdHp9gDkmnV");
      expect(media).toMatchObject({ authorHandle: "instagram", items: [{ kind: "image" }] });
      expect(soleUrl(media)).toBe("https://scontent.cdninstagram.com/own.jpg");
    });

    it("is inconclusive when media follows the quoted post, rather than guessing whose it is", () => {
      const html = quoteFixture().replace(
        '<div class="PostDateContainer">',
        OWN_IMAGE + '<div class="PostDateContainer">',
      );
      expect(mapThreadsEmbedToMedia(html, "DdHp9gDkmnV")).toBeNull();
    });

    it("is inconclusive when the quoted post has no media either", () => {
      const html = quoteFixture().replace(/<video\b[\s\S]*?<\/video>/, "");
      expect(mapThreadsEmbedToMedia(html, "DdHp9gDkmnV")).toBeNull();
    });
  });

  it("maps a carousel to one item per slide, videos and images in their own order", () => {
    const media = mapThreadsEmbedToMedia(fixture("carousel"), "DZ7eGA1G7wU");
    expect(media?.items).toEqual([
      { kind: "video", qualities: [expect.objectContaining({ url: expect.stringContaining("/AQOT") })] },
      { kind: "image", imageUrl: expect.stringContaining("/728809712_") },
      { kind: "video", qualities: [expect.objectContaining({ url: expect.stringContaining("/AQMq") })] },
    ]);
  });

  it("is inconclusive for several media elements outside a carousel wrapper", () => {
    const unwrapped = fixture("carousel").replaceAll("MediaScrollContainer", "SoloMediaContainer");
    expect(mapThreadsEmbedToMedia(unwrapped, "DZ7eGA1G7wU")).toBeNull();
  });

  it("maps an unavailable post to not-found", () => {
    expect(errorCode(() => mapThreadsEmbedToMedia(fixture("missing"), "DzzzzzzzzzZ"))).toBe(
      "not-found",
    );
  });

  it("is inconclusive (null) for a text-only post, so the caller falls back", () => {
    expect(mapThreadsEmbedToMedia(fixture("text"), "DdZ7sQvkTFn")).toBeNull();
  });

  it("is inconclusive (null) for markup it doesn't recognise", () => {
    expect(mapThreadsEmbedToMedia("<html><body></body></html>", "ABC")).toBeNull();
  });
});
