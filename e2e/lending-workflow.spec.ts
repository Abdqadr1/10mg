import { expect, test } from "@playwright/test";
import { signIn, signOut } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("customer applies, lender approves, customer sees the new loan", async ({ page }) => {
  await signIn(page, "aurora", "customer");

  await page.getByRole("link", { name: "Apply for a loan" }).first().click();
  await page.getByRole("radio", { name: /Salary Advance/ }).click();
  await page.getByLabel("Amount").fill("120000");
  await page.getByRole("radio", { name: "3 months" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Monthly net income").fill("650000");
  await page.getByLabel("Employer / business name").fill("Dangote Cement");
  await page.getByLabel(/BVN/).fill("22233344455");
  await page.getByLabel("What is the loan for?").fill("Rent renewal for my apartment");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("You must accept the terms")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { name: "Application received" })).toBeVisible();
  const reference = (await page.locator("main .font-mono").first().textContent())?.trim() ?? "";
  expect(reference).toMatch(/^aurora-app-/);

  await signOut(page);
  await signIn(page, "aurora", "staff");
  await page.getByRole("link", { name: "Applications" }).first().click();
  await page.getByPlaceholder("Search applicant or ID").fill(reference);
  await page.getByRole("button", { name: new RegExp(reference) }).first().click();
  await expect(page.getByText("Affordability")).toBeVisible();
  await page.getByRole("button", { name: /Approve & disburse/ }).click();
  await expect(page.getByText("Loan approved and disbursed")).toBeVisible();

  await signOut(page);
  await signIn(page, "aurora", "customer");
  await page.getByRole("link", { name: "My loans" }).first().click();
  await expect(page.getByRole("link", { name: /Salary Advance.*₦120,000\.00/ })).toBeVisible();
});

test("tenant-specific validation rejects out-of-range amounts", async ({ page }) => {
  await signIn(page, "kudi", "customer");
  await page.goto("/kudi/portal/apply");
  await page.getByRole("radio", { name: /Quick Cash/ }).click();
  await page.getByLabel("Amount").fill("5000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Amount must be between 5,000 and 100,000")).toBeVisible();
  await expect(page.getByLabel(/BVN/)).toHaveCount(0);
});
