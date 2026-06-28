import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET is required")
    .refine(
      (v) =>
        process.env.NODE_ENV !== "production" ||
        (v.length >= 32 && v !== "change-me-in-production"),
      "AUTH_SECRET must be at least 32 characters and changed in production"
    ),
  AUTH_URL: z.string().url().optional(),
  CLIENT_URL: z.string().url().optional(),
  SOCKET_PORT: z.string().optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  SENTRY_DSN: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TRUST_PROXY: z.enum(["true", "false"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let validated = false;

export function validateEnv(): Env {
  if (validated) {
    return envSchema.parse(process.env);
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    const message = "Environment validation failed:\n" + messages.join("\n");

    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error(message);
    }
    console.error(message);
  } else if (process.env.AUTH_SECRET === "change-me-in-production") {
    console.warn("[env] WARNING: AUTH_SECRET is still the default placeholder.");
  }

  validated = true;
  return result.success ? result.data : (process.env as unknown as Env);
}
