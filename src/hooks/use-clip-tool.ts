"use client";

import { useSyncExternalStore } from "react";
import { clipToolStore, IDLE_STATE } from "@/lib/clip-tool-store";

export type {
  BlobStatus,
  ClipToolErrorCode,
  ClipToolState,
} from "@/lib/clip-tool-store";

/**
 * Subscribes to the module-level clipToolStore rather than owning state
 * locally, so the flow survives remounts of whatever renders <ClipTool/>
 * (e.g. locale navigation remounting `[locale]/page.tsx`) instead of
 * refetching. Which post is shown comes from ?url= via syncFromUrl.
 */
export function useClipTool() {
  const state = useSyncExternalStore(
    clipToolStore.subscribe,
    clipToolStore.getState,
    () => IDLE_STATE,
  );

  return {
    state,
    setUrl: clipToolStore.setUrl,
    submit: clipToolStore.submit,
    syncFromUrl: clipToolStore.syncFromUrl,
    selectQuality: clipToolStore.selectQuality,
    ensureBlob: clipToolStore.ensureBlob,
    retryBlob: clipToolStore.retryBlob,
    reset: clipToolStore.reset,
  };
}
