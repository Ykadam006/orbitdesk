import { rateLimit as memoryRateLimit, authRateLimit as memoryAuthRateLimit } from "@/lib/rateLimit";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
        ["TTL", key],
      ]),
    });

    if (!res.ok) return null;

    const results = (await res.json()) as { result: number }[];
    const count = results[0]?.result ?? 1;
    const ttl = results[2]?.result ?? windowSec;
    const reset = Date.now() + ttl * 1000;

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch {
    return null;
  }
}

export async function rateLimitAsync(
  key: string,
  limit = 100,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redis = await upstashRateLimit(`rl:${key}`, limit, windowSec);
  if (redis) return redis;
  return memoryRateLimit(key, limit, windowMs);
}

export async function authRateLimitAsync(key: string): Promise<RateLimitResult> {
  const redis = await upstashRateLimit(`auth:${key}`, 10, 15 * 60);
  if (redis) return redis;
  return memoryAuthRateLimit(key);
}
