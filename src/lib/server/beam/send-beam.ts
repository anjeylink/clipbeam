import webpush, { WebPushError } from "web-push";
import { getIntlayer, getLocalizedUrl, type Locale } from "intlayer";
import { URL_QUERY_PARAM } from "@/lib/clip-tool-store";
import { getPhone, keepPhone, removePhone } from "./beam-store";

export interface BeamPayload {
  title: string;
  body: string;
  // Same-origin path the notification opens.
  url: string;
}

export type BeamMessage =
  // A post to share: opens the clip tool with it preloaded, so one more tap
  // on Share reaches the OS share sheet.
  | { kind: "post"; postUrl: string }
  // Sent the moment a computer connects, proving the whole chain works.
  | { kind: "connected" };

export type BeamDelivery = "delivered" | "no-phone";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Beam push is not configured: missing VAPID env vars");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

function toPayload(message: BeamMessage, locale: Locale): BeamPayload {
  const text = getIntlayer("beam-notification", locale);
  switch (message.kind) {
    case "post": {
      const query = new URLSearchParams({ [URL_QUERY_PARAM]: message.postUrl });
      return {
        title: text.post.title,
        body: message.postUrl,
        url: `${getLocalizedUrl("/", locale)}?${query}`,
      };
    }
    case "connected":
      return {
        title: text.connected.title,
        body: text.connected.body,
        url: getLocalizedUrl("/beam", locale),
      };
  }
}

/**
 * Pushes a message to one phone. "no-phone" means it can't be reached: it
 * never subscribed, expired, or the push service reports its subscription
 * gone (404/410), in which case the record is dropped.
 */
export async function sendBeam(phoneId: string, message: BeamMessage): Promise<BeamDelivery> {
  configureVapid();
  const phone = await getPhone(phoneId);
  if (!phone) return "no-phone";

  try {
    await webpush.sendNotification(
      phone.subscription,
      JSON.stringify(toPayload(message, phone.locale)),
    );
  } catch (error) {
    if (
      error instanceof WebPushError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      await removePhone(phoneId);
      return "no-phone";
    }
    throw error;
  }

  await keepPhone(phoneId);
  return "delivered";
}
