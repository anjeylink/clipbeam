"use client";

import { Download, Loader2, RefreshCw, Share2 } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNativeShare } from "@/hooks/use-native-share";
import type { ParsedXMedia } from "@/lib/parse-x-url";
import type { BlobStatus } from "@/hooks/use-clip-tool";

interface ShareActionsProps {
  media: ParsedXMedia;
  selectedQualityIndex: number;
  blob: Blob | null;
  blobStatus: BlobStatus;
  onRetryBlob: () => void;
}

const FALLBACK_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionFromMimeType(mimeType: string): string {
  return FALLBACK_EXTENSION_BY_MIME_TYPE[mimeType] ?? mimeType.split("/")[1] ?? "bin";
}

export function ShareActions({
  media,
  selectedQualityIndex,
  blob,
  blobStatus,
  onRetryBlob,
}: ShareActionsProps) {
  const content = useIntlayer("share-actions");
  const isVideo = media.kind === "video";
  const activeQuality = isVideo ? media.qualities![selectedQualityIndex] : null;
  // The real blob's Content-Type (once fetched) is authoritative — X photos
  // can be PNG/WebP, not just JPEG — with a guessed fallback so the Share
  // feature-detection probe (see useNativeShare) has something to check
  // before the blob resolves.
  const guessedMimeType = isVideo ? "video/mp4" : "image/jpeg";
  const mimeType = blob?.type || guessedMimeType;
  const extension = extensionFromMimeType(mimeType);
  const filename = `clipbeam-${media.authorHandle}-${activeQuality?.label ?? "image"}.${extension}`;

  const { canShareFiles, share, download, shareError } = useNativeShare({
    blob,
    filename,
    mimeType,
    shareTitle: String(content.shareTitle),
    shareText: content.shareText({ handle: media.authorHandle }),
  });

  const isLoading = blobStatus === "loading";
  const isError = blobStatus === "error";
  const disabled = isLoading || isError;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {canShareFiles ? (
          <Button type="button" onClick={share} disabled={disabled} className="h-11 flex-1">
            {isLoading ? (
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
        <Button
          type="button"
          variant={canShareFiles ? "outline" : "default"}
          onClick={download}
          disabled={disabled}
          className="h-11 flex-1"
        >
          {isLoading ? (
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
              <Download data-icon="inline-start" className="size-4" aria-hidden="true" />
              {content.download}
            </>
          )}
        </Button>
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
