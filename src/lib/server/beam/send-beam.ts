import webpush, { WebPushError } from "web-push";
import { getIntlayer, getLocalizedUrl } from "intlayer";
import { URL_QUERY_PARAM } from "@/lib/clip-tool-store";
import { listSubscriptions, removeSubscription } from "./beam-store";

export interface BeamPayload {
  title: string;
  body: string;
  // Same-origin path the notification opens: the clip tool with the post
  // preloaded, so one more tap on Share reaches the OS share sheet.
  url: string;
}

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

/**
 * Pushes a post URL to every subscribed phone. Returns how many
 * subscriptions it was delivered to; 0 means no phone is listening.
 * Subscriptions the push service reports as gone are dropped.
 */
export async function sendBeam(postUrl: string): Promise<number> {
  configureVapid();
  const subscriptions = await listSubscriptions();

  const results = await Promise.all(
    subscriptions.map(async ({ subscription, locale }) => {
      const query = new URLSearchParams({ [URL_QUERY_PARAM]: postUrl });
      const payload: BeamPayload = {
        title: getIntlayer("beam-notification", locale).title,
        body: postUrl,
        url: `${getLocalizedUrl("/", locale)}?${query}`,
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return true;
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          await removeSubscription(subscription.endpoint);
          return false;
        }
        throw error;
      }
    }),
  );

  return results.filter(Boolean).length;
}
