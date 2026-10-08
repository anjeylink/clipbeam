import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichVideoQualitySizes } from "./enrich-video-sizes";
import type { ResolvedMedia, ResolvedVideoQuality } from "@/lib/server/resolved-media";

function videoMedia(...qualitiesPerItem: ResolvedVideoQuality[][]): ResolvedMedia {
  return {
    platform: "x",
    postUrl: "https://x.com/someone/status/123",
    authorHandle: "someone",
    items: qualitiesPerItem.map((qualities) => ({
      kind: "video",
      posterUrl: "https://pbs.twimg.com/poster.jpg",
      qualities,
    })),
  };
}

function sizesMb(media: ResolvedMedia): number[][] {
  return media.items.map((item) =>
    item.kind === "video" ? item.qualities.map((quality) => quality.approxSizeMb) : [],
  );
}

describe("enrichVideoQualitySizes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes non-video media through untouched, without hitting the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const image: ResolvedMedia = {
      platform: "x",
      postUrl: "https://x.com/someone/status/123",
      authorHandle: "someone",
      items: [{ kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" }],
    };

    expect(await enrichVideoQualitySizes(image)).toBe(image);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("leaves an already-nonzero bitrate estimate alone, without hitting the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const media = videoMedia([
      { label: "720p", width: 1280, height: 720, url: "https://video.twimg.com/a.mp4", approxSizeMb: 3.02 },
    ]);

    const result = await enrichVideoQualitySizes(media);

    expect(sizesMb(result)).toEqual([[3.02]]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fills in a real size from Content-Length when the bitrate estimate is 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, headers: new Headers({ "content-length": "5000000" }) })),
    );
    const media = videoMedia([
      { label: "720p", width: 1280, height: 720, url: "https://video.twimg.com/a.mp4", approxSizeMb: 0 },
    ]);

    const result = await enrichVideoQualitySizes(media);

    expect(sizesMb(result)).toEqual([[5]]);
  });

  it("keeps the 0 estimate when the HEAD probe fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const media = videoMedia([
      { label: "720p", width: 1280, height: 720, url: "https://video.twimg.com/a.mp4", approxSizeMb: 0 },
    ]);

    const result = await enrichVideoQualitySizes(media);

    expect(sizesMb(result)).toEqual([[0]]);
  });

  it("probes every video of a carousel that lacks a size", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, headers: new Headers({ "content-length": "5000000" }) })),
    );
    const media = videoMedia(
      [{ label: "720p", width: 1280, height: 720, url: "https://video.twimg.com/a.mp4", approxSizeMb: 2 }],
      [{ label: "720p", width: 1280, height: 720, url: "https://video.twimg.com/b.mp4", approxSizeMb: 0 }],
    );

    expect(sizesMb(await enrichVideoQualitySizes(media))).toEqual([[2], [5]]);
  });
});
