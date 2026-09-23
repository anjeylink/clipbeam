"use client";

import { useCallback, useEffect, useState } from "react";

export type ShareErrorCode = "interrupted";

interface UseNativeShareOptions {
  blob: Blob | null;
  filename: string;
  mimeType: string;
}

interface UseNativeShareResult {
  /** True once the OS share sheet can accept this file (mostly mobile browsers). */
  canShareFiles: boolean;
  /** True once the blob has resolved and share() can act on it. */
  isReady: boolean;
  share: () => Promise<void>;
  shareError: ShareErrorCode | null;
}

/**
 * Feature-detects Web Share API file support and exposes share. Plain
 * downloads don't go through here — they stream via /api/download.
 * Detection runs only in an effect (never during render) to avoid an
 * SSR/hydration mismatch, since `navigator` doesn't exist on the server.
 */
export function useNativeShare({
  blob,
  filename,
  mimeType,
}: UseNativeShareOptions): UseNativeShareResult {
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [shareError, setShareError] = useState<ShareErrorCode | null>(null);

  useEffect(() => {
    let next = false;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      // Probe with a zero-byte stand-in file so this doesn't wait on the
      // real blob resolving — canShare cares about filename/mimeType
      // support, not file content, so the Share button can be present from
      // first paint instead of popping in once the media download finishes.
      const probeFile = new File([], filename, { type: mimeType });
      next =
        "canShare" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [probeFile] });
    }
    // Feature detection must run post-mount (not during render) so the
    // server-rendered markup (no `navigator`) matches the client's first
    // paint before hydration adjusts it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShareFiles(next);
  }, [filename, mimeType]);

  const share = useCallback(async () => {
    if (!blob) return;
    setShareError(null);
    try {
      const file = new File([blob], filename, { type: mimeType });
      // Files only: messengers like Telegram send any title/text as a
      // separate message alongside the media.
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareError("interrupted");
    }
  }, [blob, filename, mimeType]);

  return { canShareFiles, isReady: blob !== null, share, shareError };
}
