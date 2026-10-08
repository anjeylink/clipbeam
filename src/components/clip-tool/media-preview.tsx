import { Badge } from "@/components/ui/badge";
import { ImageIcon, PlayCircle } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import type { MediaItem } from "@/lib/parse-post-url";

interface MediaPreviewProps {
  item: MediaItem;
  authorHandle: string;
  selectedQualityIndex: number;
}

export function MediaPreview({ item, authorHandle, selectedQualityIndex }: MediaPreviewProps) {
  const content = useIntlayer("media-preview");
  const isVideo = item.kind === "video";
  const activeQuality = isVideo ? item.qualities[selectedQualityIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {isVideo ? (
          <video
            key={activeQuality?.proxiedUrl}
            controls
            poster={item.posterUrl}
            // Without a poster (Threads embeds give none), metadata preload
            // lets the browser paint the first frame instead of a black box.
            preload="metadata"
            className="aspect-video w-full bg-black"
          >
            <source src={activeQuality?.proxiedUrl} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt={content.altText({ handle: authorHandle })}
            className="aspect-video w-full object-contain"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>@{authorHandle}</span>
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
