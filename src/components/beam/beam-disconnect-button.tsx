"use client";

import { useState } from "react";
import { Loader2, Unlink } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BeamDisconnectButton() {
  const content = useIntlayer("beam-disconnect-button");
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "disconnecting" | "failed">("idle");

  const handleClick = async () => {
    setStatus("disconnecting");
    try {
      const res = await fetch("/api/beam/disconnect", { method: "POST" });
      if (res.ok) {
        // Drops any ?notice= left by an earlier send; it no longer applies.
        router.replace(pathname);
        return;
      }
      setStatus("failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{content.hint}</p>
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={status === "disconnecting"}
          className="h-11 shrink-0 self-start sm:px-6"
        >
          {status === "disconnecting" ? (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Unlink data-icon="inline-start" className="size-4" aria-hidden="true" />
          )}
          {content.label}
        </Button>
      </div>
      <div role="status">
        {status === "failed" ? (
          <Alert variant="destructive">
            <AlertDescription>{content.failed}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
