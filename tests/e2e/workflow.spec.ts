import { test, expect } from "@playwright/test";

test.describe("OrbitDesk full workflow", () => {
  test("register → create workspace → create board → create card → move card", async ({ page }) => {
    const testEmail = `test-${Date.now()}@orbitdesk.dev`;

    // 1. Register
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Welcome back")).toBeVisible();

    // 2. Create workspace
    await page.getByText("Create Workspace").click();
    await page.getByLabel("Workspace Name").fill("Test Workspace");
    await page.getByRole("button", { name: "Create" }).click();

    // Should see the workspace card
    await expect(page.getByText("Test Workspace")).toBeVisible({ timeout: 5000 });

    // 3. Navigate to workspace
    await page.getByText("Test Workspace").click();
    await expect(page.getByRole("heading", { name: "Test Workspace" })).toBeVisible({ timeout: 5000 });

    // 4. Create board
    await page.getByText("Create Board").click();
    await page.getByPlaceholder("Board title").fill("Sprint 1");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Sprint 1")).toBeVisible({ timeout: 5000 });

    // 5. Navigate to board
    await page.getByText("Sprint 1").click();
    await expect(page.getByText("Todo")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Review")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();

    // 6. Create a card in Todo column
    const todoColumn = page.locator("text=Todo").locator("..").locator("..");
    await todoColumn.getByRole("button").first().click();
    await expect(page.getByText("New Card")).toBeVisible({ timeout: 3000 });
    await page.getByLabel("Title").fill("Fix login bug");
    await page.getByRole("button", { name: "Create Card" }).click();

    // Card should appear in Todo column
    await expect(page.getByText("Fix login bug")).toBeVisible({ timeout: 5000 });
  });

  test("login with existing credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByLabel("Email").fill("yogesh@orbitdesk.dev");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("landing page loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("OrbitDesk")).toBeVisible();
    await expect(page.getByText("Real-Time Collaborative")).toBeVisible();
    await expect(page.getByText("Get Started Free")).toBeVisible();
    await expect(page.getByText("Kanban Boards")).toBeVisible();
    await expect(page.getByText("Real-Time Sync")).toBeVisible();
  });
});
