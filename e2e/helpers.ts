import { expect, type Page } from "@playwright/test";

export async function signIn(page: Page, tenant: string, audience: "customer" | "staff") {
  await page.goto(`/${tenant}/login${audience === "staff" ? "?as=staff" : ""}`);
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await expect(page).toHaveURL(new RegExp(`/${tenant}/${audience === "staff" ? "lender" : "portal"}`));
}

export async function signOut(page: Page) {
  await page.locator("header").getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
}
