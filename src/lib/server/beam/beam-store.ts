import { randomInt } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { PushSubscription } from "web-push";
import type { Locale } from "intlayer";
import { BEAM_CODE_LENGTH, BEAM_CODE_TTL_SECONDS } from "@/lib/beam";
import { BEAM_COOKIE_MAX_AGE_SECONDS } from "./beam-auth";

export interface StoredPhone {
  subscription: PushSubscription;
  // The locale the phone subscribed in; the notification text and the page
  // it opens use it.
  locale: Locale;
}

// A phone nobody sends to or opens Beam on expires with its cookie, so
// abandoned subscriptions don't pile up.
const PHONE_TTL_SECONDS = BEAM_COOKIE_MAX_AGE_SECONDS;

const phoneKey = (phoneId: string) => `beam:phone:${phoneId}`;
const codeKey = (code: string) => `beam:code:${code}`;

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

export async function savePhone(phoneId: string, phone: StoredPhone): Promise<void> {
  await getRedis().set(phoneKey(phoneId), phone, { ex: PHONE_TTL_SECONDS });
}

export async function getPhone(phoneId: string): Promise<StoredPhone | null> {
  return getRedis().get<StoredPhone>(phoneKey(phoneId));
}

export async function keepPhone(phoneId: string): Promise<void> {
  await getRedis().expire(phoneKey(phoneId), PHONE_TTL_SECONDS);
}

export async function removePhone(phoneId: string): Promise<void> {
  await getRedis().del(phoneKey(phoneId));
}

/** A fresh single-use code that points at the phone until it expires. */
export async function createCode(phoneId: string): Promise<string> {
  // NX: a code that's already live for another phone is never overwritten.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInt(0, 10 ** BEAM_CODE_LENGTH)
      .toString()
      .padStart(BEAM_CODE_LENGTH, "0");
    const set = await getRedis().set(codeKey(code), phoneId, {
      nx: true,
      ex: BEAM_CODE_TTL_SECONDS,
    });
    if (set === "OK") return code;
  }
  throw new Error("Couldn't find a free Beam code");
}

/** The phone a code points at, deleting the code so it works only once. */
export async function consumeCode(code: string): Promise<string | null> {
  return getRedis().getdel<string>(codeKey(code));
}

/**
 * Fixed-window counter: true while `bucket` has seen at most `limit` calls
 * in the current window. The window's expiry is set before the increment in
 * the same round trip, so a counter can never be left without one.
 */
export async function allowAttempt(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `beam:limit:${bucket}`;
  const [, count] = await getRedis()
    .pipeline()
    .set(key, 0, { nx: true, ex: windowSeconds })
    .incr(key)
    .exec<[unknown, number]>();
  return count <= limit;
}
