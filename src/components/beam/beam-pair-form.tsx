"use client";

import { useId, useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PairStatus = "idle" | "pairing" | "invalid-key" | "failed";

export function BeamPairForm() {
  const content = useIntlayer("beam-pair-form");
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<PairStatus>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!key || status === "pairing") return;
    setStatus("pairing");
    try {
      const res = await fetch("/api/beam/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setStatus(res.status === 401 ? "invalid-key" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  const errorMessage =
    status === "invalid-key"
      ? content.errors.invalidKey
      : status === "failed"
        ? content.errors.failed
        : null;

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <p className="text-sm text-muted-foreground">{content.intro}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{content.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={inputId}
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              disabled={status === "pairing"}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorId : undefined}
              className="h-11 pl-9"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "pairing" || !key}
            className="h-11 shrink-0 sm:px-6"
          >
            {status === "pairing" ? (
              <Loader2
                data-icon="inline-start"
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {content.submit}
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
