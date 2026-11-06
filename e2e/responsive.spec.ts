import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("lender console is usable on a phone", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await signIn(page, "kudi", "staff");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Loans" }).click();
  await expect(page.getByRole("heading", { name: "Loan book" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
