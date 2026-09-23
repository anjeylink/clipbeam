"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { useClipTool } from "@/hooks/use-clip-tool";
import { URL_QUERY_PARAM } from "@/lib/clip-tool-store";
import type { Platform } from "@/lib/media-types";
import { UrlInputForm } from "./url-input-form";
import { MediaPreviewSkeleton } from "./media-preview-skeleton";
import { MediaPreview } from "./media-preview";
import { QualityPicker } from "./quality-picker";
import { ShareActions } from "./share-actions";

// Brand names, so not translated.
const PLATFORM_NAMES: Record<Platform, string> = { x: "X", threads: "Threads" };

// Feeds ?url= into the store — on mount (a reload, a shared link, or a
// locale switch) and whenever it changes. Split out so only this
// null-rendering child suspends on useSearchParams for the `force-static`
// page, leaving the prerendered form intact.
function ClipToolUrlSync({ onUrlParam }: { onUrlParam: (param: string | null) => void }) {
  const param = useSearchParams().get(URL_QUERY_PARAM);
  useEffect(() => {
    onUrlParam(param);
  }, [param, onUrlParam]);
  return null;
}

export function ClipTool() {
  const content = useIntlayer("clip-tool");
  const { state, setUrl, submit, syncFromUrl, selectQuality, ensureBlob, retryBlob } =
    useClipTool();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "loaded") {
      resultHeadingRef.current?.focus();
    }
  }, [state.status]);

  const isBusy = state.status === "validating" || state.status === "loading";
  let errorMessage: string | undefined;
  if (state.status === "error") {
    const { code, platform } = state;
    errorMessage =
      platform && code in content.platformErrors
        ? String(
            content.platformErrors[code as keyof typeof content.platformErrors]({
              platform: PLATFORM_NAMES[platform],
            }),
          )
        : String(content.errors[code]);
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="flex flex-col gap-6">
        <Suspense fallback={null}>
          <ClipToolUrlSync onUrlParam={syncFromUrl} />
        </Suspense>
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
                onEnsureBlob={ensureBlob}
                onRetryBlob={retryBlob}
              />
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
