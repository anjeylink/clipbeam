import { describe, it, expect } from "vitest";
import { mapTweetJsonToMedia } from "./map-tweet-to-media";
import { MediaResolutionError } from "./media-resolution-error";

const POST_URL = "https://x.com/someone/status/123";

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

  it("throws multi-media-unsupported for a multi-photo tweet", () => {
    const multiPhoto = {
      __typename: "Tweet",
      user: { screen_name: "someone" },
      mediaDetails: [
        { type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" },
        { type: "photo", media_url_https: "https://pbs.twimg.com/b.jpg" },
      ],
    };
    expect(() => mapTweetJsonToMedia(multiPhoto, POST_URL)).toThrow(MediaResolutionError);
    try {
      mapTweetJsonToMedia(multiPhoto, POST_URL);
    } catch (err) {
      expect((err as MediaResolutionError).code).toBe("multi-media-unsupported");
    }
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
      kind: "image",
      posterUrl: "https://pbs.twimg.com/a.jpg",
      imageUrl: "https://pbs.twimg.com/a.jpg",
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
    expect(media.kind).toBe("video");
    expect(media.qualities).toHaveLength(2);
    expect(media.qualities?.[0]).toMatchObject({ label: "720p", width: 1280, height: 720 });
    expect(media.qualities?.[0].approxSizeMb).toBeCloseTo(3.02, 1);
    expect(media.qualities?.[1]).toMatchObject({ label: "360p", width: 640, height: 360 });
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
    expect(media.kind).toBe("video");
    expect(media.qualities).toHaveLength(1);
  });
});
