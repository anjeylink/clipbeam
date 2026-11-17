// What became of a link sent through /api/beam/send.
export type SendResult =
  | "sent"
  | "disconnected"
  | "invalid-format"
  | "too-many-attempts"
  | "failed";

const RESULT_BY_STATUS: Partial<Record<number, SendResult>> = {
  200: "sent",
  // 401: this computer was never connected, or its cookie no longer verifies.
  // 409: the phone stopped receiving. Either way the server has cleared the
  // computer's cookies.
  401: "disconnected",
  409: "disconnected",
  422: "invalid-format",
  429: "too-many-attempts",
};

/** Sends a post link to the phone this computer is connected to. */
export async function sendToPhone(url: string): Promise<SendResult> {
  try {
    const res = await fetch("/api/beam/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return RESULT_BY_STATUS[res.status] ?? "failed";
  } catch {
    return "failed";
  }
}
