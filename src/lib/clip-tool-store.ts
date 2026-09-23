import {
  parsePostUrl,
  validatePostUrl,
  ParsePostUrlError,
  type ParsedMedia,
  type ParsePostUrlErrorCode,
  type Platform,
} from "@/lib/parse-post-url";

// "idle" = not requested yet: the blob only exists to feed the Web Share API
// (which needs a File in hand), so it's fetched lazily via ensureBlob() rather
// than for every loaded post. Plain downloads stream via /api/download instead.
export type BlobStatus = "idle" | "loading" | "ready" | "error";

export type ClipToolErrorCode = ParsePostUrlErrorCode;

export type ClipToolState =
  | { status: "idle"; url: string }
  | { status: "validating"; url: string }
  | { status: "loading"; url: string }
  | {
      status: "loaded";
      url: string;
      media: ParsedMedia;
      selectedQualityIndex: number;
      blob: Blob | null;
      blobStatus: BlobStatus;
    }
  // platform is absent only when the link didn't match any Platform; error
  // copy that names the Platform (e.g. rate-limiting) reads it from here.
  | { status: "error"; url: string; code: ClipToolErrorCode; platform?: Platform };

// Share-capable browsers prefetch the default-selected quality's blob (see
// ensureBlob below) before the user has chosen anything — real posts can
// offer variants well over 50MB, so defaulting to the highest available
// quality would silently burn a lot of a mobile user's data before they've
// touched the page. Default instead to the highest quality at or under 720p
// (by short edge, so portrait video isn't penalized), falling back to the
// smallest available if every variant exceeds that.
const DEFAULT_QUALITY_MAX_SHORT_EDGE = 720;

function defaultQualityIndex(media: ParsedMedia): number {
  if (media.kind !== "video" || media.qualities.length === 0) return 0;
  const index = media.qualities.findIndex(
    (q) => Math.min(q.width, q.height) <= DEFAULT_QUALITY_MAX_SHORT_EDGE,
  );
  return index === -1 ? media.qualities.length - 1 : index;
}

/** The already-proxied URL for the media (or the selected video quality). */
function proxiedMediaUrl(media: ParsedMedia, qualityIndex: number): string {
  return media.kind === "video" ? media.qualities[qualityIndex].proxiedUrl : media.proxiedUrl;
}

export const URL_QUERY_PARAM = "url";

// The address bar (?url=...) is the source of truth for which post the tool
// shows: a reload, a shared link, or a locale switch that carries the query
// all restore it, and navigating to a URL without it (e.g. the header logo)
// resets the tool. Written via the raw History API — not next/navigation's
// router — so it can't trigger a server-component re-render for a
// `force-static` page; Next still syncs the change into useSearchParams,
// which is how <ClipTool/> feeds it back into syncFromUrl().
function syncUrlQueryParam(url: string) {
  if (typeof window === "undefined") return;
  const next = new URL(window.location.href);
  if (url) {
    next.searchParams.set(URL_QUERY_PARAM, url);
  } else {
    next.searchParams.delete(URL_QUERY_PARAM);
  }
  // null, not window.history.state: Next treats state carrying its own
  // `__NA` marker as an internal call and skips syncing useSearchParams.
  // It copies its internal state over a null itself.
  window.history.replaceState(null, "", next);
}

export const IDLE_STATE: ClipToolState = { status: "idle", url: "" };

/**
 * Module-level singleton (not React state) holding everything the URL can't:
 * the resolved media, selected quality, and any in-flight blob fetch. It
 * survives remounts of the component tree that holds <ClipTool/> — e.g. the
 * locale switcher navigating to a new `[locale]/page.tsx`, which the App
 * Router always re-renders from scratch — so a remount whose ?url= matches
 * what's already loaded doesn't refetch. React components subscribe to this
 * via useSyncExternalStore instead of owning the state themselves.
 */
class ClipToolStore {
  private state: ClipToolState = IDLE_STATE;
  // The post URL currently loading or shown — unlike state.url, which is the
  // live input value and changes as the user types.
  private activeUrl = "";
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

  // Always reloads, even for the active URL, so re-submitting after an error
  // retries.
  submit = (rawUrl: string) => {
    const url = rawUrl.trim();
    syncUrlQueryParam(url);
    this.load(url);
  };

  // Called whenever ?url= changes (including on mount). A no-op when it
  // matches what's already loaded, which is what keeps a locale switch from
  // refetching.
  syncFromUrl = (param: string | null) => {
    const url = (param ?? "").trim();
    if (url === this.activeUrl) return;
    if (url) {
      this.load(url);
    } else {
      this.clear();
    }
  };

  private load(url: string) {
    this.activeUrl = url;
    // Bumped before validating so an earlier in-flight resolve can't
    // overwrite this load's result, even an immediate invalid-format error.
    const requestId = ++this.submitRequestId;
    this.setState({ status: "validating", url });

    const validation = validatePostUrl(url);
    if (!validation.valid) {
      this.setState({ status: "error", url, code: "invalid-format" });
      return;
    }
    const { platform } = validation;

    this.setState({ status: "loading", url });
    parsePostUrl(url)
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
          err instanceof ParsePostUrlError ? err.code : "unknown";
        this.setState({ status: "error", url, code, platform });
      });
  }

  selectQuality = (index: number) => {
    if (this.state.status !== "loaded" || this.state.selectedQualityIndex === index) return;

    // Drop any in-flight fetch for the previous quality; ensureBlob() starts
    // the new one if the Share flow wants it.
    this.blobAbortController?.abort();
    this.blobRequestId++;
    const cached = this.blobCache.get(proxiedMediaUrl(this.state.media, index));
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
    syncUrlQueryParam("");
    this.clear();
  };

  private clear() {
    this.activeUrl = "";
    // Invalidates any in-flight resolve so it can't land after the reset.
    this.submitRequestId++;
    this.blobCache.clear();
    this.blobAbortController?.abort();
    this.blobRequestId++;
    this.setState(IDLE_STATE);
  }

  private fetchBlob() {
    if (this.state.status !== "loaded") return;

    this.blobAbortController?.abort();
    const controller = new AbortController();
    this.blobAbortController = controller;

    const { media, selectedQualityIndex } = this.state;
    const requestId = ++this.blobRequestId;
    // Already proxied by toClientMedia server-side: video.twimg.com 403s
    // browser-originated cross-origin requests and Threads URLs expire, so
    // every media URL the client holds is either hotlink-safe or already
    // routed through /api/download — this store never has to know which.
    const sourceUrl = proxiedMediaUrl(media, selectedQualityIndex);

    fetch(sourceUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch media");
        return res.blob();
      })
      .then((blob) => {
        if (this.blobRequestId !== requestId || this.state.status !== "loaded") return;
        this.blobCache.set(sourceUrl, blob);
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
