import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapInstagramPageToMedia } from "./map-instagram-page";
import { MediaResolutionError } from "./media-resolution-error";

// Real crawler-UA post pages, cut down to the data-sjs JSON that holds the
// post (trimmed to the fields the mapper reads), captured 2026-09-24.
function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__/instagram", `page-${name}.html`), "utf8");
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

describe("mapInstagramPageToMedia", () => {
  it("maps a Reel with its dimensions and poster", () => {
    const media = mapInstagramPageToMedia(fixture("video"), "DdhFkS7KGkZ");
    expect(media).toMatchObject({
      platform: "instagram",
      kind: "video",
      authorHandle: "ravens",
      postUrl: "https://www.instagram.com/p/DdhFkS7KGkZ/",
    });
    expect(media.posterUrl).toMatch(/^https:\/\/[^/]+\.(?:fbcdn\.net|cdninstagram\.com)\//);
    expect(media.qualities).toEqual([
      expect.objectContaining({ label: "720p", width: 720, height: 1280 }),
    ]);
  });

  it("maps an image to the post's own full-size candidate, not the timeline thumbnail", () => {
    // The fixture's first data-sjs block is the author's timeline, listing
    // the same post (same code and media_type) with only a 640px display_uri.
    const media = mapInstagramPageToMedia(fixture("image"), "Ddbo7s0lzoy");
    expect(media).toMatchObject({ platform: "instagram", kind: "image", authorHandle: "nasa" });
    expect(media.imageUrl).toMatch(/815798049_/);
    expect(media.imageUrl).not.toContain("s640x640");
  });

  it("rejects a carousel as multi-media-unsupported", () => {
    expect(errorCode(() => mapInstagramPageToMedia(fixture("carousel"), "DdZMsPElzSl"))).toBe(
      "multi-media-unsupported",
    );
  });

  it("maps a page without the requested post to not-found", () => {
    expect(errorCode(() => mapInstagramPageToMedia(fixture("video"), "Zz0000000000"))).toBe(
      "not-found",
    );
  });
});
