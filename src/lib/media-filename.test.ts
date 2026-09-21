import { describe, expect, it } from "vitest";
import { extensionFromMimeType, sanitizeFilenameBase } from "./media-filename";

describe("extensionFromMimeType", () => {
  it("maps known mime types", () => {
    expect(extensionFromMimeType("video/mp4")).toBe("mp4");
    expect(extensionFromMimeType("image/jpeg")).toBe("jpg");
    expect(extensionFromMimeType("image/png")).toBe("png");
  });

  it("ignores mime parameters and case", () => {
    expect(extensionFromMimeType("Video/MP4; codecs=avc1")).toBe("mp4");
  });

  it("falls back to the subtype, then to bin", () => {
    expect(extensionFromMimeType("image/avif")).toBe("avif");
    expect(extensionFromMimeType("weird")).toBe("bin");
  });
});

describe("sanitizeFilenameBase", () => {
  it("leaves safe names untouched", () => {
    expect(sanitizeFilenameBase("clipbeam-jack_1-720p")).toBe("clipbeam-jack_1-720p");
  });

  it("replaces path separators, quotes, and whitespace", () => {
    expect(sanitizeFilenameBase('../evil"x y')).toBe("_evil_x_y");
  });

  it("strips leading dots and falls back when nothing is left", () => {
    expect(sanitizeFilenameBase("...")).toBe("clipbeam");
    expect(sanitizeFilenameBase("")).toBe("clipbeam");
  });

  it("caps the length", () => {
    expect(sanitizeFilenameBase("a".repeat(500))).toHaveLength(100);
  });
});
