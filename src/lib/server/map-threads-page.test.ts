import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mapThreadsPageToMedia } from "./map-threads-page";
import { MediaResolutionError } from "./media-resolution-error";
import type { ResolvedMedia, ResolvedVideoQuality } from "./resolved-media";

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

// The one quality of a post expected to hold exactly one video.
function soleQuality(media: ResolvedMedia): ResolvedVideoQuality {
  expect(media.items).toHaveLength(1);
  const [item] = media.items;
  if (item.kind !== "video") throw new Error("expected a video");
  expect(item.qualities).toHaveLength(1);
  return item.qualities[0];
}

describe("mapThreadsPageToMedia", () => {
  it("maps a video post with its dimensions and poster", () => {
    const media = mapThreadsPageToMedia(fixture("video"), "DcwLClnmOrR");
    expect(media).toMatchObject({
      platform: "threads",
      authorHandle: "zuck",
      postUrl: "https://www.threads.com/@zuck/post/DcwLClnmOrR",
      items: [{ kind: "video", posterUrl: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\//) }],
    });
    expect(soleQuality(media)).toMatchObject({
      label: "620p",
      width: 1280,
      height: 620,
      approxSizeMb: 0,
    });
  });

  it("maps an image post to its largest candidate", () => {
    const media = mapThreadsPageToMedia(fixture("image"), "Dcy_A8pGo-m");
    expect(media).toMatchObject({ platform: "threads", authorHandle: "zuck" });
    expect(media.items).toEqual([
      { kind: "image", imageUrl: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\//) },
    ]);
  });

  it("picks the requested post, not another video post from the same thread", () => {
    const html = fixture("reply-video");
    const reply = mapThreadsPageToMedia(html, "DctzKbqgOUy");
    const sibling = mapThreadsPageToMedia(html, "DctzI_Jj0Hv");
    expect(soleQuality(reply).url).not.toBe(soleQuality(sibling).url);
    expect(soleQuality(reply).label).toBe("720p");
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
      authorHandle: "brain_auto",
      postUrl: "https://www.threads.com/@ronaldojcoutinho7/post/DdmXUCrII-S",
      items: [{ kind: "video", posterUrl: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\//) }],
    });
    expect(soleQuality(media)).toMatchObject({
      label: "720p",
      width: 720,
      height: 1280,
      url: expect.stringMatching(/^https:\/\/[^/]+\.fbcdn\.net\//),
    });
  });

  it("maps a carousel to one item per slide, telling videos from images without a media_type", () => {
    const media = mapThreadsPageToMedia(fixture("carousel"), "DZ7eGA1G7wU");
    expect(media.items).toEqual([
      {
        kind: "video",
        posterUrl: expect.stringContaining("/729466804_"),
        qualities: [expect.objectContaining({ label: "720p", width: 720, height: 900 })],
      },
      { kind: "image", imageUrl: expect.stringContaining("/728809712_") },
      {
        kind: "video",
        posterUrl: expect.stringContaining("/727566051_"),
        qualities: [expect.objectContaining({ label: "720p", width: 720, height: 900 })],
      },
    ]);
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
