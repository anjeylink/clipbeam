import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichVideoQualitySizes } from "./enrich-video-sizes";
import type { ResolvedMedia } from "@/lib/server/resolved-media";

function videoMedia(qualities: ResolvedMedia["qualities"]): ResolvedMedia {
  return {
    platform: "x",
    postUrl: "https://x.com/someone/status/123",
    authorHandle: "someone",
    kind: "video",
    posterUrl: "https://pbs.twimg.com/poster.jpg",
    qualities,
  };
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
      kind: "image",
      posterUrl: "https://pbs.twimg.com/a.jpg",
      imageUrl: "https://pbs.twimg.com/a.jpg",
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

    expect(result.qualities?.[0].approxSizeMb).toBe(3.02);
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

    expect(result.qualities?.[0].approxSizeMb).toBe(5);
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

    expect(result.qualities?.[0].approxSizeMb).toBe(0);
  });
});
