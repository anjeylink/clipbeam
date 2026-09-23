import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapThreadsPageToMedia } from "./map-threads-page";
import { MediaResolutionError } from "./media-resolution-error";

// Real crawler-UA post pages, cut down to the data-sjs JSON that holds post
// objects (each trimmed to the fields the mapper reads), captured 2026-09-23.
function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__/threads", `page-${name}.html`), "utf8");
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

describe("mapThreadsPageToMedia", () => {
  it("maps a video post with its dimensions and poster", () => {
    const media = mapThreadsPageToMedia(fixture("video"), "DcwLClnmOrR");
    expect(media).toMatchObject({
      platform: "threads",
      kind: "video",
      authorHandle: "zuck",
      postUrl: "https://www.threads.com/@zuck/post/DcwLClnmOrR",
    });
    expect(media.posterUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
    expect(media.qualities).toEqual([
      expect.objectContaining({ label: "620p", width: 1280, height: 620, approxSizeMb: 0 }),
    ]);
  });

  it("maps an image post to its largest candidate", () => {
    const media = mapThreadsPageToMedia(fixture("image"), "Dcy_A8pGo-m");
    expect(media).toMatchObject({ platform: "threads", kind: "image", authorHandle: "zuck" });
    expect(media.imageUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
  });

  it("picks the requested post, not another video post from the same thread", () => {
    const html = fixture("reply-video");
    const reply = mapThreadsPageToMedia(html, "DctzKbqgOUy");
    const sibling = mapThreadsPageToMedia(html, "DctzI_Jj0Hv");
    expect(reply.kind).toBe("video");
    expect(sibling.kind).toBe("video");
    expect(reply.qualities?.[0].url).not.toBe(sibling.qualities?.[0].url);
    expect(reply.qualities?.[0].label).toBe("720p");
  });

  it("maps a text post quoting a video to no-media, not the quoted video", () => {
    expect(errorCode(() => mapThreadsPageToMedia(fixture("quote-of-video"), "DdHp9gDkmnV"))).toBe(
      "no-media",
    );
  });

  it("maps a text post linking to an Instagram reel to the reel's video, credited to its author", () => {
    const media = mapThreadsPageToMedia(fixture("link-to-instagram-video"), "DdmXUCrII-S");
    expect(media).toMatchObject({
      platform: "threads",
      kind: "video",
      authorHandle: "brain_auto",
      postUrl: "https://www.threads.com/@ronaldojcoutinho7/post/DdmXUCrII-S",
    });
    expect(media.posterUrl).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
    expect(media.qualities).toEqual([
      expect.objectContaining({ label: "720p", width: 720, height: 1280 }),
    ]);
    expect(media.qualities?.[0].url).toMatch(/^https:\/\/[^/]+\.fbcdn\.net\//);
  });

  it("rejects a carousel as multi-media-unsupported", () => {
    expect(errorCode(() => mapThreadsPageToMedia(fixture("carousel"), "DZ7eGA1G7wU"))).toBe(
      "multi-media-unsupported",
    );
  });

  it("maps a text-only post to no-media", () => {
    expect(errorCode(() => mapThreadsPageToMedia(fixture("text"), "DdZ7sQvkTFn"))).toBe(
      "no-media",
    );
  });

  it("maps a page without the requested post to not-found", () => {
    expect(errorCode(() => mapThreadsPageToMedia(fixture("text"), "DzzzzzzzzzZ"))).toBe(
      "not-found",
    );
  });
});
