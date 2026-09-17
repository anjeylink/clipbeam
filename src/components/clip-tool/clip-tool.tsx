"use client";

import { useEffect, useRef } from "react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { useClipTool } from "@/hooks/use-clip-tool";
import { URL_QUERY_PARAM } from "@/lib/clip-tool-store";
import { UrlInputForm } from "./url-input-form";
import { MediaPreviewSkeleton } from "./media-preview-skeleton";
import { MediaPreview } from "./media-preview";
import { QualityPicker } from "./quality-picker";
import { ShareActions } from "./share-actions";

export function ClipTool() {
  const content = useIntlayer("clip-tool");
  const { state, setUrl, submit, selectQuality, retryBlob } = useClipTool();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const didAttemptRestoreRef = useRef(false);

  useEffect(() => {
    if (state.status === "loaded") {
      resultHeadingRef.current?.focus();
    }
  }, [state.status]);

  // Restores the preview from a `?url=` param on a fresh page load (a hard
  // reload, or a shared/bookmarked link) — the in-memory store above
  // already handles same-session remounts (e.g. locale switching) without
  // needing this, since it never went back to "idle" in that case.
  useEffect(() => {
    if (didAttemptRestoreRef.current) return;
    didAttemptRestoreRef.current = true;
    if (state.status !== "idle") return;
    const initialUrl = new URLSearchParams(window.location.search).get(URL_QUERY_PARAM);
    if (initialUrl) submit(initialUrl);
    // Runs once on mount only — re-checking on every state change would
    // re-trigger this after the user clears the input back to empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBusy = state.status === "validating" || state.status === "loading";
  const errorMessage =
    state.status === "error" ? String(content.errors[state.code]) : undefined;

  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="flex flex-col gap-6">
        <UrlInputForm
          value={state.url}
          onValueChange={setUrl}
          onSubmit={submit}
          isBusy={isBusy}
          errorMessage={errorMessage}
        />

        <section aria-live="polite" aria-busy={state.status === "loading"}>
          <span className="sr-only" role="status">
            {state.status === "loading"
              ? content.loadingPreview
              : state.status === "loaded"
                ? content.previewReady
                : ""}
          </span>

          {state.status === "loading" ? <MediaPreviewSkeleton /> : null}

          {state.status === "loaded" ? (
            <div className="flex flex-col gap-4">
              <h2
                ref={resultHeadingRef}
                tabIndex={-1}
                className="text-sm font-medium outline-none"
              >
                {content.previewHeading}
              </h2>
              <MediaPreview
                media={state.media}
                selectedQualityIndex={state.selectedQualityIndex}
              />
              {state.media.kind === "video" && state.media.qualities ? (
                <QualityPicker
                  qualities={state.media.qualities}
                  selectedIndex={state.selectedQualityIndex}
                  onChange={selectQuality}
                />
              ) : null}
              <ShareActions
                media={state.media}
                selectedQualityIndex={state.selectedQualityIndex}
                blob={state.blob}
                blobStatus={state.blobStatus}
                onRetryBlob={retryBlob}
              />
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
