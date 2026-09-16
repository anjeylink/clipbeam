"use client";

import { useId, useState, type FormEvent } from "react";
import { Clipboard, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isBusy: boolean;
  errorMessage?: string;
}

export function UrlInputForm({ onSubmit, isBusy, errorMessage }: UrlInputFormProps) {
  const [value, setValue] = useState("");
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
      if (text) setValue(text);
    } catch {
      // Clipboard access denied or unsupported — user can paste manually.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>X (Twitter) post link</Label>
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
              onChange={(event) => setValue(event.target.value)}
              disabled={isBusy}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorId : undefined}
              className="h-11 pl-9 pr-11"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={isBusy}
              aria-label="Paste link from clipboard"
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
                Fetching…
              </>
            ) : (
              "Get media"
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
