"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { parseXUrl, validateXUrl, type ParsedXMedia } from "@/lib/parse-x-url";

type BlobStatus = "loading" | "ready" | "error";

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
  | { status: "error"; url: string; message: string };

type Action =
  | { type: "SUBMIT"; url: string }
  | { type: "VALIDATION_FAILED"; url: string; message: string }
  | { type: "PARSE_STARTED"; url: string }
  | { type: "PARSE_SUCCEEDED"; media: ParsedXMedia }
  | { type: "PARSE_FAILED"; url: string; message: string }
  | { type: "SELECT_QUALITY"; index: number }
  | { type: "BLOB_READY"; blob: Blob }
  | { type: "BLOB_FAILED" }
  | { type: "RESET" };

const INVALID_FORMAT_MESSAGE =
  "That doesn't look like an X (Twitter) post link. Paste a URL like https://x.com/user/status/12345.";

function reducer(state: ClipToolState, action: Action): ClipToolState {
  switch (action.type) {
    case "SUBMIT":
      return { status: "validating", url: action.url };
    case "VALIDATION_FAILED":
      return { status: "error", url: action.url, message: action.message };
    case "PARSE_STARTED":
      return { status: "loading", url: action.url };
    case "PARSE_SUCCEEDED":
      return {
        status: "loaded",
        media: action.media,
        selectedQualityIndex: 0,
        blob: null,
        blobStatus: "loading",
      };
    case "PARSE_FAILED":
      return { status: "error", url: action.url, message: action.message };
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
        message: INVALID_FORMAT_MESSAGE,
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
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        dispatch({ type: "PARSE_FAILED", url, message });
      });
  }, []);

  const selectQuality = useCallback((index: number) => {
    dispatch({ type: "SELECT_QUALITY", index });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

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

  return { state, submit, selectQuality, reset };
}
