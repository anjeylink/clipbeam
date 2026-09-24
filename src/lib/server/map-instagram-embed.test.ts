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
    expect(media).toMatchObject({
      platform: "instagram",
      kind: "video",
      // A collab post: credited to the owner, not the co-author.
      authorHandle: "ravens",
      postUrl: "https://www.instagram.com/p/DdhFkS7KGkZ/",
    });
    expect(media?.posterUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
    expect(media?.qualities).toEqual([
      expect.objectContaining({ label: "720p", width: 720, height: 1280, approxSizeMb: 0 }),
    ]);
    expect(media?.qualities?.[0].url).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\/.+\.mp4\?/);
  });

  it("maps an image to the widest srcset entry, not the header avatar", () => {
    const media = mapInstagramEmbedToMedia(fixture("image"), "Ddbo7s0lzoy");
    expect(media).toMatchObject({
      platform: "instagram",
      kind: "image",
      authorHandle: "nasa",
      postUrl: "https://www.instagram.com/p/Ddbo7s0lzoy/",
    });
    expect(media?.imageUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\/v\/t51\.82787-15\/815798049_/);
    expect(media?.imageUrl).toContain("stp=dst-jpg_e35_tt6&");
    expect(media?.imageUrl).not.toContain("&amp;");
  });

  it("rejects a carousel as multi-media-unsupported", () => {
    expect(errorCode(() => mapInstagramEmbedToMedia(fixture("carousel"), "DdZMsPElzSl"))).toBe(
      "multi-media-unsupported",
    );
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
