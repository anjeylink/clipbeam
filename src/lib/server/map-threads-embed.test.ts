import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapThreadsEmbedToMedia } from "./map-threads-embed";
import { MediaResolutionError } from "./media-resolution-error";

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

describe("mapThreadsEmbedToMedia", () => {
  it("maps a single-video post to one unlabelled quality with no poster", () => {
    const media = mapThreadsEmbedToMedia(fixture("video"), "DcwLClnmOrR");
    expect(media).toMatchObject({
      platform: "threads",
      kind: "video",
      authorHandle: "zuck",
      postUrl: "https://www.threads.com/@zuck/post/DcwLClnmOrR",
    });
    expect(media?.posterUrl).toBeUndefined();
    expect(media?.qualities).toHaveLength(1);
    expect(media?.qualities?.[0]).toMatchObject({ label: null, width: 0, height: 0 });
    expect(media?.qualities?.[0].url).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\/.+\.mp4\?/);
  });

  it("decodes HTML entities in media URLs", () => {
    const media = mapThreadsEmbedToMedia(fixture("video"), "DcwLClnmOrR");
    expect(media?.qualities?.[0].url).not.toContain("&amp;");
    expect(media?.qualities?.[0].url).toContain("&");
  });

  it("maps a single-image post to its media image, not the author avatar", () => {
    const media = mapThreadsEmbedToMedia(fixture("image"), "Dcy_A8pGo-m");
    expect(media).toMatchObject({ platform: "threads", kind: "image", authorHandle: "zuck" });
    expect(media?.imageUrl).toContain("/t51.82787-15/");
    expect(media?.imageUrl).not.toContain("/t51.82787-19/");
  });

  it("reads only the requested reply, not the parent post rendered above it", () => {
    const media = mapThreadsEmbedToMedia(fixture("reply-video"), "DctzKbqgOUy");
    expect(media).toMatchObject({ kind: "video", authorHandle: "zuck" });
    expect(media?.qualities).toHaveLength(1);
  });

  it("ignores a quoted post's media — a text post quoting a video is inconclusive", () => {
    // The quoted post is rendered as another "OuterContainerFull" block inside
    // the target; its video and author must never be attributed to the quoter.
    expect(mapThreadsEmbedToMedia(fixture("quote-of-video"), "DdHp9gDkmnV")).toBeNull();
  });

  it("rejects a carousel as multi-media-unsupported", () => {
    expect(errorCode(() => mapThreadsEmbedToMedia(fixture("carousel"), "DZ7eGA1G7wU"))).toBe(
      "multi-media-unsupported",
    );
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
