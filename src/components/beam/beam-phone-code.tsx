"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatBeamCode } from "@/lib/beam";

type CodeState =
  | { status: "loading" }
  | { status: "shown"; code: string; expiresInSeconds: number }
  | { status: "expired" }
  | { status: "too-many-attempts" }
  | { status: "failed" };

// Shown once this phone can receive: the code a computer types to connect.
// Every code works once, so each extra computer takes a new one.
export function BeamPhoneCode({ computerUrl }: { computerUrl: string }) {
  const content = useIntlayer("beam-phone-code");
  const [state, setState] = useState<CodeState>({ status: "loading" });

  const requestCode = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/beam/code", { method: "POST" });
      if (res.ok) {
        const { code, expiresInSeconds } = (await res.json()) as {
          code: string;
          expiresInSeconds: number;
        };
        setState({ status: "shown", code, expiresInSeconds });
        return;
      }
      setState({ status: res.status === 429 ? "too-many-attempts" : "failed" });
    } catch {
      setState({ status: "failed" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the first code on mount
    void requestCode();
  }, [requestCode]);

  useEffect(() => {
    if (state.status !== "shown") return;
    const timer = setTimeout(
      () => setState({ status: "expired" }),
      state.expiresInSeconds * 1000,
    );
    return () => clearTimeout(timer);
  }, [state]);

  const error =
    state.status === "expired"
      ? content.expired
      : state.status === "too-many-attempts"
        ? content.tooManyAttempts
        : state.status === "failed"
          ? content.failed
          : null;

  return (
    <div className="flex flex-col gap-3" aria-busy={state.status === "loading"}>
      <p className="text-sm">
        {content.intro} <span className="font-medium whitespace-nowrap">{computerUrl}</span>
      </p>
      {state.status === "shown" ? (
        <p
          aria-label={String(content.codeLabel)}
          className="font-mono text-4xl font-semibold tracking-widest tabular-nums"
        >
          {formatBeamCode(state.code)}
        </p>
      ) : null}
      <div role="status">
        {error ? (
          <Alert variant={state.status === "expired" ? "default" : "destructive"}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{content.hint}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => void requestCode()}
        disabled={state.status === "loading"}
        className="h-11 self-start sm:px-6"
      >
        {state.status === "loading" ? (
          <Loader2 data-icon="inline-start" className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw data-icon="inline-start" className="size-4" aria-hidden="true" />
        )}
        {content.newCode}
      </Button>
    </div>
  );
}
