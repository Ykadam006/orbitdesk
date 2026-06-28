import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: "npx prisma migrate deploy && npx prisma db seed && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          DATABASE_URL:
            process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@localhost:5432/orbitdesk",
          AUTH_SECRET: process.env.AUTH_SECRET || "e2e-test-secret-must-be-at-least-32-chars",
          AUTH_URL: "http://localhost:3000",
        },
      }
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
      },
});
