import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const primaryOf = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim());

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("each institution renders with its own brand", async ({ page }) => {
  await page.goto("/aurora");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Considered credit");
  expect(await primaryOf(page)).toBe("#0b6e4f");

  await page.goto("/kudi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Small loans");
  expect(await primaryOf(page)).toBe("#6d28d9");
});

test("sessions are isolated per institution", async ({ page }) => {
  await signIn(page, "aurora", "staff");
  await page.goto("/kudi/lender");
  await expect(page).toHaveURL(/\/kudi\/login/);
});

test("lender can rebrand the portal from settings", async ({ page }) => {
  await signIn(page, "harbor", "staff");
  await page.getByRole("link", { name: "White-label settings" }).first().click();
  await page.getByLabel("Institution name").fill("Harbor Credit Plus");
  const primary = page.getByRole("textbox", { name: "Primary colour", exact: true });
  await primary.fill("#b91c1c");
  await page.getByRole("button", { name: "Save & publish" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();
  await expect.poll(() => primaryOf(page)).toBe("#b91c1c");

  await page.goto("/harbor");
  await expect(page.locator("header")).toContainText("Harbor Credit Plus");
  expect(await primaryOf(page)).toBe("#b91c1c");
});

test("unknown institutions show a not-found state", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expect(page.getByRole("heading", { name: "Institution not found" })).toBeVisible();
});
