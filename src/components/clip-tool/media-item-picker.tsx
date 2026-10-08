import { useId } from "react";
import { Radio } from "@base-ui/react/radio";
import { PlayCircle } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { RadioGroup } from "@/components/ui/radio-group";
import type { MediaItem } from "@/lib/parse-post-url";

interface MediaItemPickerProps {
  items: MediaItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function MediaItemPicker({ items, selectedIndex, onChange }: MediaItemPickerProps) {
  const content = useIntlayer("media-item-picker");
  const legendId = useId();
  const count = items.length;
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend id={legendId} className="text-sm font-medium">
        {content.legend({ count })}
      </legend>
      <RadioGroup
        aria-labelledby={legendId}
        value={String(selectedIndex)}
        onValueChange={(value) => onChange(Number(value))}
        className="flex gap-2 overflow-x-auto p-1"
      >
        {items.map((item, index) => {
          const isVideo = item.kind === "video";
          const thumbnailUrl = isVideo ? item.posterUrl : item.previewUrl;
          const label = isVideo ? content.video : content.image;
          return (
            <Radio.Root
              key={index}
              value={String(index)}
              aria-label={String(label({ position: index + 1, count }))}
              className="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-transparent bg-muted text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary"
            >
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span aria-hidden="true" className="text-sm font-medium">
                  {index + 1}
                </span>
              )}
              {isVideo ? (
                <PlayCircle
                  aria-hidden="true"
                  className="absolute right-1 bottom-1 size-4 rounded-full bg-background/80 text-foreground"
                />
              ) : null}
            </Radio.Root>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
