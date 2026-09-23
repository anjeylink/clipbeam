"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// When a Beam notification is tapped while ClipBeam is already open, the
// service worker focuses that window and posts the URL here rather than
// navigating it itself (WindowClient.navigate() isn't reliable on iOS).
export function BeamMessageListener() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; url?: unknown } | null;
      // Same-origin paths only: "//host" would be protocol-relative.
      if (
        data?.type === "beam" &&
        typeof data.url === "string" &&
        data.url.startsWith("/") &&
        !data.url.startsWith("//")
      ) {
        router.push(data.url);
      }
    };

    container.addEventListener("message", handleMessage);
    return () => container.removeEventListener("message", handleMessage);
  }, [router]);

  return null;
}
