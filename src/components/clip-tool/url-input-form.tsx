"use client";

import { useId, type FormEvent } from "react";
import { Clipboard, Link as LinkIcon, Loader2 } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface UrlInputFormProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (url: string) => void;
  isBusy: boolean;
  errorMessage?: string;
}

export function UrlInputForm({
  value,
  onValueChange,
  onSubmit,
  isBusy,
  errorMessage,
}: UrlInputFormProps) {
  const content = useIntlayer("url-input-form");
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || isBusy) return;
    onSubmit(value);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onValueChange(text);
    } catch {
      // Clipboard access denied or unsupported — user can paste manually.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{content.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <LinkIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={inputId}
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://x.com/username/status/1234567890"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              disabled={isBusy}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorId : undefined}
              className="h-11 pl-9 pr-11"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={isBusy}
              aria-label={String(content.pasteAriaLabel)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Clipboard className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={isBusy || !value.trim()}
            className={cn("h-11 shrink-0 sm:px-6")}
          >
            {isBusy ? (
              <>
                <Loader2
                  data-icon="inline-start"
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                {content.fetching}
              </>
            ) : (
              content.getMedia
            )}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive" id={errorId}>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
