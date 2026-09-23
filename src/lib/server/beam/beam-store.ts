import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";
import type { Locale } from "intlayer";

export interface StoredBeamSubscription {
  subscription: PushSubscription;
  // The locale the phone subscribed in; the notification text and the page
  // it opens use it.
  locale: Locale;
}

// One hash, keyed by the push endpoint, so a phone re-subscribing overwrites
// its own entry instead of piling up duplicates.
const SUBSCRIPTIONS_KEY = "beam:subscriptions";

let redis: Redis | null = null;

// Created on first use, not at import: a build or a dev server without the
// Upstash env vars must still render every page.
function getRedis(): Redis {
  if (!redis) {
    // A Vercel-managed Upstash store injects the KV_* names; a store
    // connected directly from Upstash uses the UPSTASH_* ones.
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error("Beam store is not configured: missing Upstash Redis env vars");
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function saveSubscription(
  subscription: PushSubscription,
  locale: Locale,
): Promise<void> {
  const entry: StoredBeamSubscription = { subscription, locale };
  await getRedis().hset(SUBSCRIPTIONS_KEY, { [subscription.endpoint]: entry });
}

export async function listSubscriptions(): Promise<StoredBeamSubscription[]> {
  const all = await getRedis().hgetall<Record<string, StoredBeamSubscription>>(
    SUBSCRIPTIONS_KEY,
  );
  return all ? Object.values(all) : [];
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await getRedis().hdel(SUBSCRIPTIONS_KEY, endpoint);
}
