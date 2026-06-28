import { NextRequest, NextResponse } from "next/server";
import { authRateLimitAsync, rateLimitAsync } from "@/lib/rateLimitRedis";
import { getClientIp } from "@/lib/ip";

const AUTH_PATHS = [
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/callback/credentials",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  const clientKey = getClientIp(req);
  const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const result = isAuthRoute
    ? await authRateLimitAsync(clientKey)
    : await rateLimitAsync(clientKey);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.reset));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
