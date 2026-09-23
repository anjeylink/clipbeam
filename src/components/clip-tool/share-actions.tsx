"use client";

import { useEffect } from "react";
import { Download, Loader2, RefreshCw, Share2 } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNativeShare } from "@/hooks/use-native-share";
import type { ParsedMedia } from "@/lib/parse-post-url";
import type { BlobStatus } from "@/hooks/use-clip-tool";
import { appendDownloadFilename } from "@/lib/append-download-filename";
import { extensionFromMimeType } from "@/lib/media-filename";

interface ShareActionsProps {
  media: ParsedMedia;
  selectedQualityIndex: number;
  blob: Blob | null;
  blobStatus: BlobStatus;
  onEnsureBlob: () => void;
  onRetryBlob: () => void;
}

export function ShareActions({
  media,
  selectedQualityIndex,
  blob,
  blobStatus,
  onEnsureBlob,
  onRetryBlob,
}: ShareActionsProps) {
  const content = useIntlayer("share-actions");
  const isVideo = media.kind === "video";
  const activeQuality = isVideo ? media.qualities[selectedQualityIndex] : null;
  // The real blob's Content-Type (once fetched) is authoritative — photos
  // can be PNG/WebP, not just JPEG — with a guessed fallback so the Share
  // feature-detection probe (see useNativeShare) has something to check
  // before the blob resolves.
  const guessedMimeType = isVideo ? "video/mp4" : "image/jpeg";
  const mimeType = blob?.type || guessedMimeType;
  const extension = extensionFromMimeType(mimeType);
  const qualitySlug = isVideo ? (activeQuality?.label ?? "original") : "image";
  const filenameBase = `clipbeam-${media.authorHandle}-${qualitySlug}`;
  const filename = `${filenameBase}.${extension}`;
  // Download streams straight from our proxy as an attachment, so it starts
  // instantly and never waits on (or holds in memory) the blob below, which
  // only exists to feed Share.
  const proxiedUrl = media.kind === "video" ? media.qualities[selectedQualityIndex].proxiedUrl : media.proxiedUrl;
  const downloadHref = appendDownloadFilename(proxiedUrl, filenameBase);

  const { canShareFiles, share, shareError } = useNativeShare({
    blob,
    filename,
    mimeType,
    shareTitle: String(content.shareTitle),
    shareText: content.shareText({ handle: media.authorHandle }),
  });

  // Only browsers that can share files need the blob, so only they pay for
  // the prefetch — on desktop it would be a large download nobody asked for.
  useEffect(() => {
    if (canShareFiles) onEnsureBlob();
  }, [canShareFiles, blobStatus, selectedQualityIndex, media, onEnsureBlob]);

  const isPreparing = blobStatus === "idle" || blobStatus === "loading";
  const isError = canShareFiles && blobStatus === "error";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {canShareFiles ? (
          <Button
            type="button"
            onClick={share}
            disabled={isPreparing || isError}
            className="h-12 flex-1 px-4"
          >
            {isPreparing ? (
              <>
                <Loader2
                  data-icon="inline-start"
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                {content.preparing}
              </>
            ) : (
              <>
                <Share2 data-icon="inline-start" className="size-4" aria-hidden="true" />
                {content.share}
              </>
            )}
          </Button>
        ) : null}
        {/* No `download` attribute: it would force-save a proxy error's JSON
            body as a "video" file. The server's Content-Disposition names the
            file on success; an error instead opens in the throwaway tab. */}
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener"
          className={cn(
            buttonVariants({ variant: canShareFiles ? "outline" : "default" }),
            "h-12 flex-1 px-4",
          )}
        >
          <Download data-icon="inline-start" className="size-4" aria-hidden="true" />
          {content.download}
        </a>
      </div>
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{content.prepareFailed}</span>
            <Button type="button" size="sm" variant="outline" onClick={onRetryBlob}>
              <RefreshCw data-icon="inline-start" className="size-4" aria-hidden="true" />
              {content.retry}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {shareError ? (
        <Alert variant="destructive">
          <AlertDescription>{content.errors[shareError]}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
