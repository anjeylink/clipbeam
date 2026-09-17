"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  parseXUrl,
  validateXUrl,
  ParseXUrlError,
  type ParsedXMedia,
  type ParseXUrlErrorCode,
} from "@/lib/parse-x-url";

export type BlobStatus = "loading" | "ready" | "error";

export type ClipToolErrorCode = ParseXUrlErrorCode;

export type ClipToolState =
  | { status: "idle" }
  | { status: "validating"; url: string }
  | { status: "loading"; url: string }
  | {
      status: "loaded";
      media: ParsedXMedia;
      selectedQualityIndex: number;
      blob: Blob | null;
      blobStatus: BlobStatus;
    }
  | { status: "error"; url: string; code: ClipToolErrorCode };

type Action =
  | { type: "SUBMIT"; url: string }
  | { type: "VALIDATION_FAILED"; url: string; code: ClipToolErrorCode }
  | { type: "PARSE_STARTED"; url: string }
  | { type: "PARSE_SUCCEEDED"; media: ParsedXMedia }
  | { type: "PARSE_FAILED"; url: string; code: ClipToolErrorCode }
  | { type: "SELECT_QUALITY"; index: number }
  | { type: "BLOB_READY"; blob: Blob }
  | { type: "BLOB_FAILED" }
  | { type: "RETRY_BLOB" }
  | { type: "RESET" };

// Auto-prefetch (see the effect below) downloads the default-selected
// quality immediately on paste, before the user has chosen anything — real
// posts can offer variants well over 50MB (unlike the old mock's ~5MB cap),
// so defaulting to the highest available quality would silently burn a lot
// of a mobile user's data before they've touched the page. Default instead
// to the highest quality at or under 720p (by short edge, so portrait video
// isn't penalized), falling back to the smallest available if every variant
// exceeds that.
const DEFAULT_QUALITY_MAX_SHORT_EDGE = 720;

function defaultQualityIndex(media: ParsedXMedia): number {
  const qualities = media.qualities;
  if (media.kind !== "video" || !qualities || qualities.length === 0) return 0;
  const index = qualities.findIndex(
    (q) => Math.min(q.width, q.height) <= DEFAULT_QUALITY_MAX_SHORT_EDGE,
  );
  return index === -1 ? qualities.length - 1 : index;
}

function reducer(state: ClipToolState, action: Action): ClipToolState {
  switch (action.type) {
    case "SUBMIT":
      return { status: "validating", url: action.url };
    case "VALIDATION_FAILED":
      return { status: "error", url: action.url, code: action.code };
    case "PARSE_STARTED":
      return { status: "loading", url: action.url };
    case "PARSE_SUCCEEDED":
      return {
        status: "loaded",
        media: action.media,
        selectedQualityIndex: defaultQualityIndex(action.media),
        blob: null,
        blobStatus: "loading",
      };
    case "PARSE_FAILED":
      return { status: "error", url: action.url, code: action.code };
    case "SELECT_QUALITY":
      if (state.status !== "loaded") return state;
      return {
        ...state,
        selectedQualityIndex: action.index,
        blob: null,
        blobStatus: "loading",
      };
    case "BLOB_READY":
      if (state.status !== "loaded") return state;
      return { ...state, blob: action.blob, blobStatus: "ready" };
    case "BLOB_FAILED":
      if (state.status !== "loaded") return state;
      return { ...state, blob: null, blobStatus: "error" };
    case "RETRY_BLOB":
      if (state.status !== "loaded") return state;
      return { ...state, blob: null, blobStatus: "loading" };
    case "RESET":
      return { status: "idle" };
    default:
      return state;
  }
}

/**
 * Drives the paste -> preview -> quality -> share flow against the mock
 * parseXUrl seam. Proactively fetches the selected media as a Blob whenever
 * it changes, so a native share/download call elsewhere can act on an
 * already-resolved Blob from inside a synchronous user click (required for
 * navigator.share's user-gesture rule) instead of awaiting a fetch there.
 */
export function useClipTool() {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });
  const requestIdRef = useRef(0);

  const submit = useCallback((rawUrl: string) => {
    const url = rawUrl.trim();
    dispatch({ type: "SUBMIT", url });

    const validation = validateXUrl(url);
    if (!validation.valid) {
      dispatch({
        type: "VALIDATION_FAILED",
        url,
        code: "invalid-format",
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    dispatch({ type: "PARSE_STARTED", url });
    parseXUrl(url)
      .then((media) => {
        if (requestIdRef.current !== requestId) return;
        dispatch({ type: "PARSE_SUCCEEDED", media });
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        const code: ClipToolErrorCode =
          err instanceof ParseXUrlError ? err.code : "unknown";
        dispatch({ type: "PARSE_FAILED", url, code });
      });
  }, []);

  const selectQuality = useCallback((index: number) => {
    dispatch({ type: "SELECT_QUALITY", index });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const retryBlob = useCallback(() => dispatch({ type: "RETRY_BLOB" }), []);

  const blobFetchKey =
    state.status === "loaded"
      ? `${state.selectedQualityIndex}:${state.blobStatus}`
      : null;

  useEffect(() => {
    if (state.status !== "loaded" || state.blobStatus !== "loading") return;

    const media = state.media;
    const sourceUrl =
      media.kind === "image"
        ? media.imageUrl!
        : media.qualities![state.selectedQualityIndex].url;

    let cancelled = false;
    fetch(sourceUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch media");
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled) dispatch({ type: "BLOB_READY", blob });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "BLOB_FAILED" });
      });

    return () => {
      cancelled = true;
    };
    // blobFetchKey mirrors the (selectedQualityIndex, blobStatus) pair that should retrigger this fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobFetchKey]);

  return { state, submit, selectQuality, retryBlob, reset };
}
