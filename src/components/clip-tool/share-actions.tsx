"use client";

import { Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNativeShare } from "@/hooks/use-native-share";
import type { ParsedXMedia } from "@/lib/parse-x-url";

interface ShareActionsProps {
  media: ParsedXMedia;
  selectedQualityIndex: number;
  blob: Blob | null;
}

export function ShareActions({ media, selectedQualityIndex, blob }: ShareActionsProps) {
  const isVideo = media.kind === "video";
  const activeQuality = isVideo ? media.qualities![selectedQualityIndex] : null;
  const extension = isVideo ? "mp4" : "jpg";
  const filename = `clipbeam-${media.authorHandle}-${activeQuality?.label ?? "image"}.${extension}`;
  const mimeType = isVideo ? "video/mp4" : "image/jpeg";

  const { canShareFiles, isReady, share, download, shareError } = useNativeShare({
    blob,
    filename,
    mimeType,
    shareTitle: "ClipBeam",
    shareText: `Media from @${media.authorHandle}'s X post`,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {canShareFiles ? (
          <Button
            type="button"
            onClick={share}
            disabled={!isReady}
            className="h-11 flex-1"
          >
            {isReady ? (
              <>
                <Share2 data-icon="inline-start" className="size-4" aria-hidden="true" />
                Share
              </>
            ) : (
              <>
                <Loader2
                  data-icon="inline-start"
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Preparing…
              </>
            )}
          </Button>
        ) : null}
        <Button
          type="button"
          variant={canShareFiles ? "outline" : "default"}
          onClick={download}
          disabled={!isReady}
          className="h-11 flex-1"
        >
          {isReady ? (
            <>
              <Download data-icon="inline-start" className="size-4" aria-hidden="true" />
              Download
            </>
          ) : (
            <>
              <Loader2
                data-icon="inline-start"
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              Preparing…
            </>
          )}
        </Button>
      </div>
      {shareError ? (
        <Alert variant="destructive">
          <AlertDescription>{shareError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
