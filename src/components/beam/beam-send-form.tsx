"use client";

import { useId, useState, type FormEvent } from "react";
import { Clipboard, Link as LinkIcon, Loader2, Send } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePostUrl } from "@/lib/parse-post-url";

type SendStatus = "idle" | "sending" | "sent" | "invalid-format" | "no-device" | "failed";

export function BeamSendForm() {
  const content = useIntlayer("beam-send-form");
  const inputId = useId();
  const statusId = useId();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");

  const send = async (value: string) => {
    if (!validatePostUrl(value).valid) {
      setStatus("invalid-format");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/beam/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      if (res.ok) {
        setStatus("sent");
        setUrl("");
        return;
      }
      setStatus(
        res.status === 422 ? "invalid-format" : res.status === 409 ? "no-device" : "failed",
      );
    } catch {
      setStatus("failed");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim() || status === "sending") return;
    void send(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Clipboard access denied or unsupported — user can paste manually.
    }
  };

  const isError = status === "invalid-format" || status === "no-device" || status === "failed";
  const message =
    status === "sent"
      ? content.sent
      : status === "invalid-format"
        ? content.errors.invalidFormat
        : status === "no-device"
          ? content.errors.noDevice
          : status === "failed"
            ? content.errors.failed
            : null;

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
              placeholder={String(content.placeholder)}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (status !== "sending") setStatus("idle");
              }}
              disabled={status === "sending"}
              aria-invalid={isError}
              aria-describedby={message ? statusId : undefined}
              className="h-11 pl-9 pr-11"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={status === "sending"}
              aria-label={String(content.pasteAriaLabel)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Clipboard className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={status === "sending" || !url.trim()}
            className="h-11 shrink-0 sm:px-6"
          >
            {status === "sending" ? (
              <Loader2
                data-icon="inline-start"
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send data-icon="inline-start" className="size-4" aria-hidden="true" />
            )}
            {content.submit}
          </Button>
        </div>
      </div>
      <div role="status" id={statusId}>
        {message ? (
          <Alert variant={isError ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
