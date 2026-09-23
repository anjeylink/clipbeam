import { Badge } from "@/components/ui/badge";
import { ImageIcon, PlayCircle } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import type { ParsedMedia } from "@/lib/parse-post-url";

interface MediaPreviewProps {
  media: ParsedMedia;
  selectedQualityIndex: number;
}

export function MediaPreview({ media, selectedQualityIndex }: MediaPreviewProps) {
  const content = useIntlayer("media-preview");
  const isVideo = media.kind === "video";
  const activeQuality = isVideo ? media.qualities[selectedQualityIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {isVideo ? (
          <video
            key={activeQuality?.proxiedUrl}
            controls
            poster={media.posterUrl}
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
            src={media.previewUrl}
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
