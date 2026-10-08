import { describe, expect, it } from "vitest";
import { toClientMedia } from "./to-client-media";
import { MediaResolutionError } from "./media-resolution-error";

const THREADS_IMAGE = "https://scontent.cdninstagram.com/v/t51.82787-15/a.jpg?oe=1&_nc_sid=2";
const THREADS_VIDEO = "https://instagram.flwo3-1.fna.fbcdn.net/o1/v/t16/a.mp4?oe=1";

function proxiedTarget(href: string | undefined): string | null {
  return new URL(href ?? "", "http://localhost").searchParams.get("url");
}

describe("toClientMedia", () => {
  it("keeps an X image preview raw (pbs.twimg.com allows hotlinking)", () => {
    const media = toClientMedia({
      platform: "x",
      postUrl: "https://x.com/someone/status/1",
      authorHandle: "someone",
      items: [{ kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" }],
    });
    expect(media).toMatchObject({
      platform: "x",
      items: [{ previewUrl: "https://pbs.twimg.com/a.jpg" }],
    });
  });

  it("proxies a Threads image preview as well as its download URL", () => {
    const media = toClientMedia({
      platform: "threads",
      postUrl: "https://www.threads.com/@zuck/post/A",
      authorHandle: "zuck",
      items: [{ kind: "image", imageUrl: THREADS_IMAGE }],
    });
    const [item] = media.items;
    if (item.kind !== "image") throw new Error("expected an image");
    expect(media.platform).toBe("threads");
    expect(proxiedTarget(item.previewUrl)).toBe(THREADS_IMAGE);
    expect(proxiedTarget(item.proxiedUrl)).toBe(THREADS_IMAGE);
  });

  it("proxies a Threads video and its poster, and keeps a null label", () => {
    const media = toClientMedia({
      platform: "threads",
      postUrl: "https://www.threads.com/@zuck/post/A",
      authorHandle: "zuck",
      items: [
        {
          kind: "video",
          posterUrl: THREADS_IMAGE,
          qualities: [{ label: null, width: 0, height: 0, url: THREADS_VIDEO, approxSizeMb: 4 }],
        },
      ],
    });
    const [item] = media.items;
    if (item.kind !== "video") throw new Error("expected a video");
    expect(proxiedTarget(item.posterUrl)).toBe(THREADS_IMAGE);
    expect(item.qualities[0].label).toBeNull();
    expect(proxiedTarget(item.qualities[0].proxiedUrl)).toBe(THREADS_VIDEO);
  });

  it("leaves posterUrl absent when the Platform gave none", () => {
    const media = toClientMedia({
      platform: "threads",
      postUrl: "https://www.threads.com/@zuck/post/A",
      authorHandle: "zuck",
      items: [
        {
          kind: "video",
          qualities: [{ label: null, width: 0, height: 0, url: THREADS_VIDEO, approxSizeMb: 4 }],
        },
      ],
    });
    const [item] = media.items;
    expect(item.kind === "video" && item.posterUrl).toBeFalsy();
  });

  it("rejects a Threads post whose media sits on another Platform's CDN", () => {
    expect(() =>
      toClientMedia({
        platform: "threads",
        postUrl: "https://www.threads.com/@zuck/post/A",
        authorHandle: "zuck",
        items: [{ kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" }],
      }),
    ).toThrow(MediaResolutionError);
  });

  it("keeps a carousel's items in order, each converted by its own kind", () => {
    const media = toClientMedia({
      platform: "threads",
      postUrl: "https://www.threads.com/@zuck/post/A",
      authorHandle: "zuck",
      items: [
        {
          kind: "video",
          qualities: [{ label: null, width: 0, height: 0, url: THREADS_VIDEO, approxSizeMb: 4 }],
        },
        { kind: "image", imageUrl: THREADS_IMAGE },
      ],
    });
    expect(media.items.map((item) => item.kind)).toEqual(["video", "image"]);
  });

  it("rejects the whole post when one carousel item sits off the allowlist", () => {
    expect(() =>
      toClientMedia({
        platform: "threads",
        postUrl: "https://www.threads.com/@zuck/post/A",
        authorHandle: "zuck",
        items: [
          { kind: "image", imageUrl: THREADS_IMAGE },
          { kind: "image", imageUrl: "https://evil.example.com/a.jpg" },
        ],
      }),
    ).toThrow(MediaResolutionError);
  });
});
