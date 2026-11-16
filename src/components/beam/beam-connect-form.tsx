"use client";

import { useId, useState, type FormEvent } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isBeamCode, normalizeBeamCode } from "@/lib/beam";

type ConnectStatus =
  | "idle"
  | "connecting"
  | "invalid-code"
  | "no-device"
  | "too-many-attempts"
  | "failed";

const STATUS_BY_HTTP: Record<number, ConnectStatus> = {
  400: "invalid-code",
  409: "no-device",
  429: "too-many-attempts",
};

// The computer's half of pairing: the code the phone shows goes in here.
export function BeamConnectForm({ phoneGone }: { phoneGone: boolean }) {
  const content = useIntlayer("beam-connect-form");
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();
  const errorId = useId();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<ConnectStatus>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "connecting") return;
    const normalized = normalizeBeamCode(code);
    if (!isBeamCode(normalized)) {
      setStatus("invalid-code");
      return;
    }

    setStatus("connecting");
    try {
      const res = await fetch("/api/beam/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      if (res.ok) {
        // The page re-renders with the send form for this computer.
        // Drops any ?notice= left by an earlier send; it no longer applies.
        router.replace(pathname);
        return;
      }
      setStatus(STATUS_BY_HTTP[res.status] ?? "failed");
    } catch {
      setStatus("failed");
    }
  };

  const errorMessage = {
    idle: null,
    connecting: null,
    "invalid-code": content.errors.invalidCode,
    "no-device": content.errors.noDevice,
    "too-many-attempts": content.errors.tooManyAttempts,
    failed: content.errors.failed,
  }[status];

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      {phoneGone && status === "idle" ? (
        <Alert>
          <AlertDescription>{content.phoneGone}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{content.label}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Smartphone
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={inputId}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={9}
              placeholder="123 456"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                if (status !== "connecting") setStatus("idle");
              }}
              disabled={status === "connecting"}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorId : undefined}
              className="h-11 pl-9 font-mono tracking-widest"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "connecting" || !code.trim()}
            className="h-11 shrink-0 sm:px-6"
          >
            {status === "connecting" ? (
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
      <div role="status" id={errorId}>
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
