"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { urlBase64ToUint8Array } from "@/lib/url-base64-to-uint8array";
import { BeamInstallGuide } from "./beam-install-guide";
import { BeamPhoneCode } from "./beam-phone-code";

type DeviceStatus =
  | "checking"
  | "install"
  | "unsupported"
  | "denied"
  | "ready"
  | "subscribing"
  | "subscribed"
  | "failed";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

async function saveSubscription(subscription: PushSubscription, locale: string) {
  const res = await fetch("/api/beam/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), locale }),
  });
  if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
}

// Turns this phone into a Beam receiver, then shows the code a computer
// types to connect. On iOS that only works inside the Home Screen app
// (16.4+), so Safari gets the install guide instead.
export function BeamDevice({ computerUrl }: { computerUrl: string }) {
  const content = useIntlayer("beam-device");
  const { locale } = useLocale();
  const [status, setStatus] = useState<DeviceStatus>("checking");
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // The worker is registered up front so that the button's click handler can
  // call pushManager.subscribe() before awaiting anything: iOS drops the
  // permission prompt once the tap's user activation has been spent.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Checked before feature support: Safari tabs on iOS may expose the
      // APIs but never get a push.
      if (isIOS() && !isStandalone()) {
        setStatus("install");
        return;
      }
      if (!("serviceWorker" in navigator && "PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        registrationRef.current = registration;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          // Re-sync, in case the server-side copy was lost or expired.
          await saveSubscription(existing, locale);
          if (!cancelled) setStatus("subscribed");
        } else if (!cancelled) {
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const handleEnable = () => {
    const registration = registrationRef.current;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!registration || !publicKey) {
      setStatus("failed");
      return;
    }

    // Must be the first call in the handler — nothing awaited before it.
    const subscribing = registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    setStatus("subscribing");

    subscribing
      .then((subscription) => saveSubscription(subscription, locale))
      .then(() => setStatus("subscribed"))
      .catch(() => {
        setStatus(Notification.permission === "denied" ? "denied" : "failed");
      });
  };

  if (status === "install") return <BeamInstallGuide />;
  if (status === "subscribed") return <BeamPhoneCode computerUrl={computerUrl} />;

  const message = {
    checking: null,
    unsupported: content.unsupported,
    denied: content.denied,
    ready: content.ready,
    subscribing: content.ready,
    failed: content.failed,
  }[status];

  return (
    <div className="flex flex-col gap-3" aria-busy={status === "checking"}>
      <div role="status">
        {message ? (
          <Alert variant={status === "failed" ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      {status === "ready" || status === "subscribing" ? (
        <Button
          type="button"
          onClick={handleEnable}
          disabled={status === "subscribing"}
          className="h-11 self-start sm:px-6"
        >
          {status === "subscribing" ? (
            <Loader2
              data-icon="inline-start"
              className="size-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <BellRing data-icon="inline-start" className="size-4" aria-hidden="true" />
          )}
          {content.enable}
        </Button>
      ) : null}
    </div>
  );
}
