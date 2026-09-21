import { Badge } from "@/components/ui/badge";
import { ImageIcon, PlayCircle } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import type { ParsedXMedia } from "@/lib/parse-x-url";
import { mediaProxyUrl } from "@/lib/media-proxy-url";

interface MediaPreviewProps {
  media: ParsedXMedia;
  selectedQualityIndex: number;
}

export function MediaPreview({ media, selectedQualityIndex }: MediaPreviewProps) {
  const content = useIntlayer("media-preview");
  const isVideo = media.kind === "video";
  const activeQuality = isVideo ? media.qualities![selectedQualityIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {isVideo ? (
          <video
            key={activeQuality?.url}
            controls
            poster={media.posterUrl}
            className="aspect-video w-full bg-black"
          >
            {/* Via the proxy: video.twimg.com 403s a browser-referred request. */}
            <source src={mediaProxyUrl(activeQuality!.url)} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.imageUrl}
            alt={content.altText({ handle: media.authorHandle })}
            className="aspect-video w-full object-contain"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>@{media.authorHandle}</span>
        <Badge variant="secondary">
          {isVideo ? (
            <PlayCircle data-icon="inline-start" className="size-3" aria-hidden="true" />
          ) : (
            <ImageIcon data-icon="inline-start" className="size-3" aria-hidden="true" />
          )}
          {isVideo ? content.video : content.image}
        </Badge>
      </div>
    </div>
  );
}
