import { useId } from "react";
import { useIntlayer } from "next-intlayer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { VideoQualityOption } from "@/lib/parse-post-url";

interface QualityPickerProps {
  qualities: VideoQualityOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function QualityPicker({ qualities, selectedIndex, onChange }: QualityPickerProps) {
  const content = useIntlayer("quality-picker");
  const legendId = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend id={legendId} className="text-sm font-medium">
        {content.legend}
      </legend>
      <RadioGroup
        aria-labelledby={legendId}
        value={String(selectedIndex)}
        onValueChange={(value) => onChange(Number(value))}
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {qualities.map((quality, index) => {
          const itemId = `${legendId}-quality-${index}`;
          return (
            <Label
              key={itemId}
              htmlFor={itemId}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border border-input px-3 py-2.5 has-data-checked:border-primary has-data-checked:bg-primary/5"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {quality.label ?? content.original}
                </span>
                <span className="text-xs text-muted-foreground">
                  {content.approxSize({ mb: quality.approxSizeMb.toFixed(1) })}
                </span>
              </span>
              <RadioGroupItem id={itemId} value={String(index)} />
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
