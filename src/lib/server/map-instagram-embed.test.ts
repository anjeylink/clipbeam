import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapInstagramEmbedToMedia } from "./map-instagram-embed";
import { MediaResolutionError } from "./media-resolution-error";

// Real /p/<shortcode>/embed/captioned/ responses, cut down to the Embed
// markup and the PolarisEmbedSimple init data (contextJSON trimmed to the
// fields the mapper reads), captured 2026-09-24.
function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__/instagram", `embed-${name}.html`), "utf8");
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

describe("mapInstagramEmbedToMedia", () => {
  it("maps a Reel to one quality labelled from its dimensions, with a poster", () => {
    const media = mapInstagramEmbedToMedia(fixture("video"), "DdhFkS7KGkZ");
    expect(media).toEqual({
      platform: "instagram",
      // A collab post: credited to the owner, not the co-author.
      authorHandle: "ravens",
      postUrl: "https://www.instagram.com/p/DdhFkS7KGkZ/",
      items: [
        {
          kind: "video",
          posterUrl: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\//),
          qualities: [
            {
              label: "720p",
              width: 720,
              height: 1280,
              approxSizeMb: 0,
              url: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\/.+\.mp4\?/),
            },
          ],
        },
      ],
    });
  });

  it("maps an image to the widest srcset entry, not the header avatar", () => {
    const media = mapInstagramEmbedToMedia(fixture("image"), "Ddbo7s0lzoy");
    expect(media).toMatchObject({
      platform: "instagram",
      authorHandle: "nasa",
      postUrl: "https://www.instagram.com/p/Ddbo7s0lzoy/",
      items: [{ kind: "image" }],
    });
    const imageUrl = media?.items[0].kind === "image" ? media.items[0].imageUrl : "";
    expect(imageUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\/v\/t51\.82787-15\/815798049_/);
    expect(imageUrl).toContain("stp=dst-jpg_e35_tt6&");
    expect(imageUrl).not.toContain("&amp;");
  });

  it("maps a carousel to one item per slide, in order", () => {
    const media = mapInstagramEmbedToMedia(fixture("carousel"), "DdZMsPElzSl");
    expect(media?.items).toEqual([
      { kind: "image", imageUrl: expect.stringContaining("/814507513_") },
      { kind: "image", imageUrl: expect.stringContaining("/813698311_") },
    ]);
  });

  it("is inconclusive for a carousel with a slide it can't read", () => {
    // A video slide stripped of its video_url: a partial carousel must not
    // pass for the whole post.
    const withUnreadableSlide = fixture("carousel").replaceAll(
      '\\"is_video\\":false',
      '\\"is_video\\":true',
    );
    expect(withUnreadableSlide).not.toBe(fixture("carousel"));
    expect(mapInstagramEmbedToMedia(withUnreadableSlide, "DdZMsPElzSl")).toBeNull();
  });

  it("maps a broken-media embed (deleted, private or gated) to not-found", () => {
    expect(errorCode(() => mapInstagramEmbedToMedia(fixture("missing"), "Zz0000000000"))).toBe(
      "not-found",
    );
  });

  it("is inconclusive when the post data belongs to another shortcode", () => {
    expect(mapInstagramEmbedToMedia(fixture("video"), "SomethingElse")).toBeNull();
  });

  it("is inconclusive for a video embed without post data", () => {
    const withoutContext = fixture("video").replace(/"contextJSON":"(?:[^"\\]|\\.)*"/, '"contextJSON":null');
    expect(mapInstagramEmbedToMedia(withoutContext, "DdhFkS7KGkZ")).toBeNull();
  });

  it("is inconclusive for markup it doesn't recognise", () => {
    expect(mapInstagramEmbedToMedia("<html><body></body></html>", "DdhFkS7KGkZ")).toBeNull();
  });
});
