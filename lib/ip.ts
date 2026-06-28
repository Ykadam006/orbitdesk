import { NextRequest } from "next/server";

/**
 * Extract client IP, respecting trusted reverse proxies when TRUST_PROXY=true.
 * When behind a known proxy (Vercel, nginx), uses the rightmost untrusted IP
 * from x-forwarded-for only if TRUST_PROXY is enabled.
 */
export function getClientIp(req: NextRequest): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const ips = forwarded.split(",").map((ip) => ip.trim());
      return ips[ips.length - 1] || "anonymous";
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }

  return req.headers.get("x-real-ip") || "anonymous";
}
