import { mediaProxyUrl } from "@/lib/media-proxy-url";
import {
  parseXUrl,
  validateXUrl,
  ParseXUrlError,
  type ParsedXMedia,
  type ParseXUrlErrorCode,
} from "@/lib/parse-x-url";

// "idle" = not requested yet: the blob only exists to feed the Web Share API
// (which needs a File in hand), so it's fetched lazily via ensureBlob() rather
// than for every loaded post. Plain downloads stream via /api/download instead.
export type BlobStatus = "idle" | "loading" | "ready" | "error";

export type ClipToolErrorCode = ParseXUrlErrorCode;

export type ClipToolState =
  | { status: "idle"; url: string }
  | { status: "validating"; url: string }
  | { status: "loading"; url: string }
  | {
      status: "loaded";
      url: string;
      media: ParsedXMedia;
      selectedQualityIndex: number;
      blob: Blob | null;
      blobStatus: BlobStatus;
    }
  | { status: "error"; url: string; code: ClipToolErrorCode };

// Share-capable browsers prefetch the default-selected quality's blob (see
// ensureBlob below) before the user has chosen anything — real posts can
// offer variants well over 50MB, so defaulting to the highest available
// quality would silently burn a lot of a mobile user's data before they've
// touched the page. Default instead to the highest quality at or under 720p
// (by short edge, so portrait video isn't penalized), falling back to the
// smallest available if every variant exceeds that.
const DEFAULT_QUALITY_MAX_SHORT_EDGE = 720;

function defaultQualityIndex(media: ParsedXMedia): number {
  const qualities = media.qualities;
  if (media.kind !== "video" || !qualities || qualities.length === 0) return 0;
  const index = qualities.findIndex(
    (q) => Math.min(q.width, q.height) <= DEFAULT_QUALITY_MAX_SHORT_EDGE,
  );
  return index === -1 ? qualities.length - 1 : index;
}

/** The upstream CDN URL for the media (or the selected video quality). */
export function mediaSourceUrl(media: ParsedXMedia, qualityIndex: number): string {
  return media.kind === "image" ? media.imageUrl! : media.qualities![qualityIndex].url;
}

export const URL_QUERY_PARAM = "url";

// Keeps the submitted post URL in the address bar (?url=...) via the raw
// History API — not next/navigation's router — so this has zero
// interaction with App Router's RSC lifecycle and can't trigger a
// server-component re-render for a `force-static` page. This is what lets
// a hard reload or a pasted/shared link restore the submitted URL (the
// parsed media/blob still have to be re-fetched — those can't live in a
// URL — but the user doesn't have to re-paste the link).
function syncUrlQueryParam(url: string) {
  if (typeof window === "undefined") return;
  const next = new URL(window.location.href);
  if (url) {
    next.searchParams.set(URL_QUERY_PARAM, url);
  } else {
    next.searchParams.delete(URL_QUERY_PARAM);
  }
  window.history.replaceState(window.history.state, "", next);
}

export const IDLE_STATE: ClipToolState = { status: "idle", url: "" };

/**
 * Module-level singleton (not React state) so the paste -> preview ->
 * quality -> share flow, and any in-flight blob fetch, survive remounts of
 * the component tree that holds <ClipTool/> — e.g. the locale switcher
 * navigating to a new `[locale]/page.tsx`, which the App Router always
 * re-renders from scratch even though it's client-side navigation. React
 * components subscribe to this via useSyncExternalStore instead of owning
 * the state themselves.
 */
class ClipToolStore {
  private state: ClipToolState = IDLE_STATE;
  private listeners = new Set<() => void>();
  private submitRequestId = 0;
  private blobRequestId = 0;
  // Keyed by the resolved media URL (stable per quality/image), so
  // re-selecting a quality already downloaded this session resolves
  // instantly from memory instead of re-hitting the network and flashing
  // the "preparing" loading state — even though the browser's own HTTP
  // cache would likely serve it fast too, skipping the fetch entirely
  // avoids the loading-state flicker altogether.
  private blobCache = new Map<string, Blob>();
  // Aborts the in-flight blob download when a newer one supersedes it (a
  // fresh submit, or the user jumping to another quality before the first
  // finishes) so an abandoned multi-MB video download doesn't keep
  // consuming bandwidth in the background.
  private blobAbortController: AbortController | null = null;

  getState = (): ClipToolState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(next: ClipToolState) {
    this.state = next;
    for (const listener of this.listeners) listener();
  }

  // Drives the URL input, which is controlled from this store (rather than
  // local component state) so the typed/submitted URL survives remounts too.
  setUrl = (url: string) => {
    this.setState({ ...this.state, url });
  };

  submit = (rawUrl: string) => {
    const url = rawUrl.trim();
    this.setState({ status: "validating", url });
    syncUrlQueryParam(url);

    const validation = validateXUrl(url);
    if (!validation.valid) {
      this.setState({ status: "error", url, code: "invalid-format" });
      return;
    }

    const requestId = ++this.submitRequestId;
    this.setState({ status: "loading", url });
    parseXUrl(url)
      .then((media) => {
        if (this.submitRequestId !== requestId) return;
        this.blobCache.clear();
        this.blobAbortController?.abort();
        this.blobRequestId++;
        this.setState({
          status: "loaded",
          url,
          media,
          selectedQualityIndex: defaultQualityIndex(media),
          blob: null,
          blobStatus: "idle",
        });
      })
      .catch((err: unknown) => {
        if (this.submitRequestId !== requestId) return;
        const code: ClipToolErrorCode =
          err instanceof ParseXUrlError ? err.code : "unknown";
        this.setState({ status: "error", url, code });
      });
  };

  selectQuality = (index: number) => {
    if (this.state.status !== "loaded" || this.state.selectedQualityIndex === index) return;

    // Drop any in-flight fetch for the previous quality; ensureBlob() starts
    // the new one if the Share flow wants it.
    this.blobAbortController?.abort();
    this.blobRequestId++;
    const cached = this.blobCache.get(mediaSourceUrl(this.state.media, index));
    this.setState({
      ...this.state,
      selectedQualityIndex: index,
      blob: cached ?? null,
      blobStatus: cached ? "ready" : "idle",
    });
  };

  // Idempotent: starts the blob download only if it hasn't been requested for
  // the current selection. Called by the Share UI once it knows the browser
  // can actually share files.
  ensureBlob = () => {
    if (this.state.status !== "loaded" || this.state.blobStatus !== "idle") return;
    this.setState({ ...this.state, blobStatus: "loading" });
    this.fetchBlob();
  };

  retryBlob = () => {
    if (this.state.status !== "loaded") return;
    this.setState({ ...this.state, blob: null, blobStatus: "loading" });
    this.fetchBlob();
  };

  reset = () => {
    this.blobCache.clear();
    this.blobAbortController?.abort();
    this.blobRequestId++;
    syncUrlQueryParam("");
    this.setState(IDLE_STATE);
  };

  private fetchBlob() {
    if (this.state.status !== "loaded") return;

    this.blobAbortController?.abort();
    const controller = new AbortController();
    this.blobAbortController = controller;

    const { media, selectedQualityIndex } = this.state;
    const requestId = ++this.blobRequestId;
    const rawUrl = mediaSourceUrl(media, selectedQualityIndex);
    // Routed through our own /api/download rather than fetched directly:
    // video.twimg.com 403s browser-originated cross-origin requests (likely
    // anti-hotlink filtering on Origin/Referer), unlike pbs.twimg.com. The
    // proxy sidesteps that for both media kinds uniformly.
    const sourceUrl = mediaProxyUrl(rawUrl);

    fetch(sourceUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch media");
        return res.blob();
      })
      .then((blob) => {
        if (this.blobRequestId !== requestId || this.state.status !== "loaded") return;
        this.blobCache.set(rawUrl, blob);
        this.setState({ ...this.state, blob, blobStatus: "ready" });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (this.blobRequestId !== requestId || this.state.status !== "loaded") return;
        this.setState({ ...this.state, blob: null, blobStatus: "error" });
      });
  }
}

export const clipToolStore = new ClipToolStore();
