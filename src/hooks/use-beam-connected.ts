"use client";

import { useSyncExternalStore } from "react";
import { hasBeamConnectedCookie } from "@/lib/beam";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Connecting or disconnecting in another tab changes the cookie with no
  // event here, so re-read whenever this tab comes back.
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

// Read on every call, not once: connecting on /beam and navigating back
// client-side keeps this module loaded.
function getSnapshot() {
  return hasBeamConnectedCookie(document.cookie);
}

// Static pages are prerendered unconnected and switch after hydration.
function getServerSnapshot() {
  return false;
}

/** Re-reads the hint after a response that may have set or cleared it. */
export function notifyBeamConnectionChanged() {
  for (const listener of listeners) listener();
}

/** Whether this computer is connected to a phone through Beam. */
export function useBeamConnected(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
