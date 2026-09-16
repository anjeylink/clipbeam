import { Badge } from "@/components/ui/badge";
import { ImageIcon, PlayCircle } from "lucide-react";
import type { ParsedXMedia } from "@/lib/parse-x-url";

interface MediaPreviewProps {
  media: ParsedXMedia;
  selectedQualityIndex: number;
}

export function MediaPreview({ media, selectedQualityIndex }: MediaPreviewProps) {
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
            <source src={activeQuality?.url} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.imageUrl}
            alt={`Media from @${media.authorHandle}'s post`}
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
          {isVideo ? "Video" : "Image"}
        </Badge>
      </div>
    </div>
  );
}
