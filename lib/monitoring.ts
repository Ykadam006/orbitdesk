/**
 * Optional error monitoring. Set SENTRY_DSN to enable Sentry reporting.
 * Without Sentry, errors are logged via lib/logger.
 */
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

export function captureException(error: unknown, context?: Record<string, unknown>) {
  logger.error("Captured exception", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });

  const dsn = process.env.SENTRY_DSN;
  if (!dsn || process.env.NODE_ENV !== "production") return;

  // Fire-and-forget Sentry envelope (no SDK dependency required)
  const payload = {
    event_id: randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    extra: context,
  };

  fetch(`https://sentry.io/api/${extractProjectId(dsn)}/store/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${extractPublicKey(dsn)}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Sentry delivery failure is non-fatal
  });
}

function extractPublicKey(dsn: string): string {
  try {
    return new URL(dsn).username;
  } catch {
    return "";
  }
}

function extractProjectId(dsn: string): string {
  try {
    return new URL(dsn).pathname.replace("/", "");
  } catch {
    return "";
  }
}
