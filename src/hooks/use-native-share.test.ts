import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNativeShare } from "./use-native-share";

function makeBlob() {
  return new Blob(["fake-bytes"], { type: "image/jpeg" });
}

describe("useNativeShare", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports canShareFiles=false when navigator.share is unsupported", async () => {
    vi.stubGlobal("navigator", {});

    const { result } = renderHook(() =>
      useNativeShare({ blob: makeBlob(), filename: "a.jpg", mimeType: "image/jpeg" }),
    );

    await waitFor(() => expect(result.current.canShareFiles).toBe(false));
  });

  it("reports canShareFiles=true when navigator.canShare accepts the file", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
    });

    const { result } = renderHook(() =>
      useNativeShare({ blob: makeBlob(), filename: "a.jpg", mimeType: "image/jpeg" }),
    );

    await waitFor(() => expect(result.current.canShareFiles).toBe(true));
  });

  it("share() swallows AbortError (user cancelled) without setting shareError", async () => {
    const abortError = new DOMException("cancelled", "AbortError");
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(abortError),
      canShare: vi.fn().mockReturnValue(true),
    });

    const { result } = renderHook(() =>
      useNativeShare({ blob: makeBlob(), filename: "a.jpg", mimeType: "image/jpeg" }),
    );

    await act(async () => {
      await result.current.share();
    });

    expect(result.current.shareError).toBeNull();
  });

  it("share() surfaces a non-abort error via shareError", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("boom")),
      canShare: vi.fn().mockReturnValue(true),
    });

    const { result } = renderHook(() =>
      useNativeShare({ blob: makeBlob(), filename: "a.jpg", mimeType: "image/jpeg" }),
    );

    await act(async () => {
      await result.current.share();
    });

    expect(result.current.shareError).toBe("interrupted");
  });

  it("isReady reflects whether a blob has been provided", () => {
    vi.stubGlobal("navigator", {});
    const { result, rerender } = renderHook(
      ({ blob }: { blob: Blob | null }) =>
        useNativeShare({ blob, filename: "a.jpg", mimeType: "image/jpeg" }),
      { initialProps: { blob: null as Blob | null } },
    );

    expect(result.current.isReady).toBe(false);
    rerender({ blob: makeBlob() });
    expect(result.current.isReady).toBe(true);
  });
});
