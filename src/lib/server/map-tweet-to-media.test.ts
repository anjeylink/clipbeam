import { describe, it, expect } from "vitest";
import { mapTweetJsonToMedia } from "./map-tweet-to-media";
import { MediaResolutionError } from "./media-resolution-error";
import type { ResolvedMedia, ResolvedVideoQuality } from "./resolved-media";

const POST_URL = "https://x.com/someone/status/123";

// The qualities of a post expected to hold exactly one video.
function videoQualities(media: ResolvedMedia): ResolvedVideoQuality[] {
  expect(media.items).toHaveLength(1);
  const [item] = media.items;
  if (item.kind !== "video") throw new Error("expected a video");
  return item.qualities;
}

describe("mapTweetJsonToMedia", () => {
  it("throws unsupported-post for a tombstoned tweet", () => {
    const tombstone = {
      __typename: "TweetTombstone",
      tombstone: { text: { text: "This Post is unavailable. Learn more" } },
    };
    expect(() => mapTweetJsonToMedia(tombstone, POST_URL)).toThrow(MediaResolutionError);
    try {
      mapTweetJsonToMedia(tombstone, POST_URL);
    } catch (err) {
      expect((err as MediaResolutionError).code).toBe("unsupported-post");
    }
  });

  it("throws no-media for a text-only tweet (mediaDetails absent)", () => {
    const textOnly = { __typename: "Tweet", user: { screen_name: "jack" } };
    expect(() => mapTweetJsonToMedia(textOnly, POST_URL)).toThrow(MediaResolutionError);
    try {
      mapTweetJsonToMedia(textOnly, POST_URL);
    } catch (err) {
      expect((err as MediaResolutionError).code).toBe("no-media");
    }
  });

  it("maps a multi-media tweet to one item per attachment, in the post's order", () => {
    const mixed = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [
        { type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" },
        {
          type: "video",
          media_url_https: "https://pbs.twimg.com/poster.jpg",
          video_info: {
            duration_millis: 1000,
            variants: [
              {
                content_type: "video/mp4",
                url: "https://video.twimg.com/vid/1280x720/a.mp4",
                bitrate: 2176000,
              },
            ],
          },
        },
        { type: "photo", media_url_https: "https://pbs.twimg.com/b.jpg" },
      ],
    };
    expect(mapTweetJsonToMedia(mixed, POST_URL).items).toEqual([
      { kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" },
      expect.objectContaining({
        kind: "video",
        posterUrl: "https://pbs.twimg.com/poster.jpg",
        qualities: [expect.objectContaining({ label: "720p" })],
      }),
      { kind: "image", imageUrl: "https://pbs.twimg.com/b.jpg" },
    ]);
  });

  it("drops a video with no mp4 variant rather than the whole post", () => {
    const tweet = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [
        { type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" },
        { type: "video", media_url_https: "https://pbs.twimg.com/poster.jpg" },
      ],
    };
    expect(mapTweetJsonToMedia(tweet, POST_URL).items).toEqual([
      { kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" },
    ]);
  });

  it("maps a single-photo tweet to an image result", () => {
    const photo = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [{ type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" }],
    };
    const media = mapTweetJsonToMedia(photo, POST_URL);
    expect(media).toEqual({
      platform: "x",
      postUrl: POST_URL,
      authorHandle: "someone",
      items: [{ kind: "image", imageUrl: "https://pbs.twimg.com/a.jpg" }],
    });
  });

  it("maps a video tweet to sorted, mp4-only quality variants", () => {
    const video = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [
        {
          type: "video",
          media_url_https: "https://pbs.twimg.com/poster.jpg",
          video_info: {
            duration_millis: 11093,
            variants: [
              { content_type: "application/x-mpegURL", url: "https://video.twimg.com/a.m3u8" },
              {
                content_type: "video/mp4",
                url: "https://video.twimg.com/vid/640x360/a.mp4",
                bitrate: 632000,
              },
              {
                content_type: "video/mp4",
                url: "https://video.twimg.com/vid/1280x720/a.mp4",
                bitrate: 2176000,
              },
            ],
          },
        },
      ],
    };
    const media = mapTweetJsonToMedia(video, POST_URL);
    const qualities = videoQualities(media);
    expect(qualities).toHaveLength(2);
    expect(qualities[0]).toMatchObject({ label: "720p", width: 1280, height: 720 });
    expect(qualities[0].approxSizeMb).toBeCloseTo(3.02, 1);
    expect(qualities[1]).toMatchObject({ label: "360p", width: 640, height: 360 });
  });

  it("maps an animated_gif tweet through the same video path as a regular video", () => {
    const gif = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [
        {
          type: "animated_gif",
          media_url_https: "https://pbs.twimg.com/poster.jpg",
          video_info: {
            duration_millis: 3000,
            variants: [
              {
                content_type: "video/mp4",
                url: "https://video.twimg.com/tweet_video/a.mp4",
                bitrate: 800000,
              },
            ],
          },
        },
      ],
    };
    const media = mapTweetJsonToMedia(gif, POST_URL);
    expect(videoQualities(media)).toHaveLength(1);
  });
});
