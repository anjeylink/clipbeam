"use client";

import { useState } from "react";
import { getLocalizedUrl } from "intlayer";
import { Loader2, Send } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notifyBeamConnectionChanged } from "@/hooks/use-beam-connected";
import { sendToPhone, type SendResult } from "@/lib/send-to-phone";

export type SendToPhoneStatus = "idle" | "sending" | SendResult;

/** Sends the loaded post to the connected phone; a new post starts idle. */
export function useSendToPhone(postUrl: string) {
  const [state, setState] = useState<{ postUrl: string; status: SendToPhoneStatus }>({
    postUrl,
    status: "idle",
  });
  const status = state.postUrl === postUrl ? state.status : "idle";

  const send = async () => {
    setState({ postUrl, status: "sending" });
    const result = await sendToPhone(postUrl);
    setState((current) => (current.postUrl === postUrl ? { postUrl, status: result } : current));
    // The server has cleared the hint; every reader of it should notice.
    if (result === "disconnected") notifyBeamConnectionChanged();
  };

  return { status, send };
}

export function SendToPhoneButton({
  status,
  onSend,
}: {
  status: SendToPhoneStatus;
  onSend: () => void;
}) {
  const content = useIntlayer("send-to-phone-button");
  const isSending = status === "sending";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSend}
      disabled={isSending}
      className="h-12 px-4 sm:flex-1"
    >
      {isSending ? (
        <Loader2 data-icon="inline-start" className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send data-icon="inline-start" className="size-4" aria-hidden="true" />
      )}
      {content.label}
    </Button>
  );
}

export function SendToPhoneMessage({ status }: { status: SendToPhoneStatus }) {
  const content = useIntlayer("send-to-phone-button");
  const { locale } = useLocale();

  return (
    <div role="status">
      {status === "sent" ? (
        <Alert>
          <AlertDescription>{content.sent}</AlertDescription>
        </Alert>
      ) : status === "disconnected" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {content.disconnected}{" "}
            <Link href={getLocalizedUrl("/beam", locale)}>{content.reconnect}</Link>
          </AlertDescription>
        </Alert>
      ) : status === "invalid-format" || status === "too-many-attempts" || status === "failed" ? (
        <Alert variant="destructive">
          <AlertDescription>{content.errors[status]}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
