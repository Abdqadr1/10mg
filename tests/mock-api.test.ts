import { describe, expect, it } from "vitest";
import { apiFetch, ApiError } from "@/lib/api/client";
import { demoCredentials } from "@/mocks/seed/tenants";
import { useAuthStore } from "@/stores/auth-store";
import type { DashboardStats, LoanApplication, Session, Tenant } from "@/types";

async function login(slug: string, role: "admin" | "customer") {
  const session = await apiFetch<Session>(`/tenants/${slug}/auth/login`, { method: "POST", body: demoCredentials(slug)[role] });
  useAuthStore.getState().setSession(slug, session);
  return session;
}

describe("mock API", () => {
  it("serves at least two independently branded tenants", async () => {
    const tenants = await apiFetch<Tenant[]>("/tenants");
    expect(tenants.length).toBeGreaterThanOrEqual(2);
    expect(new Set(tenants.map((tenant) => tenant.branding.primary)).size).toBe(tenants.length);
  });

  it("rejects credentials from another institution", async () => {
    await expect(
      apiFetch(`/tenants/kudi/auth/login`, { method: "POST", body: demoCredentials("aurora").admin }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("isolates lender data per tenant", async () => {
    await login("aurora", "admin");
    await expect(apiFetch("/tenants/kudi/lender/dashboard", { tenant: "aurora" })).rejects.toBeInstanceOf(ApiError);
    const applications = await apiFetch<LoanApplication[]>("/tenants/aurora/lender/applications", { tenant: "aurora" });
    expect(applications.length).toBeGreaterThan(0);
    expect(applications.every((application) => application.tenantId === "aurora")).toBe(true);
  });

  it("forbids customers from lender endpoints", async () => {
    await login("aurora", "customer");
    await expect(apiFetch("/tenants/aurora/lender/dashboard", { tenant: "aurora" })).rejects.toMatchObject({ status: 403 });
  });

  it("runs the full lending workflow from application to repayment", async () => {
    await login("aurora", "customer");
    const tenant = await apiFetch<Tenant>("/tenants/aurora");
    const product = tenant.products[0];
    const application = await apiFetch<LoanApplication>("/tenants/aurora/me/applications", {
      method: "POST",
      tenant: "aurora",
      body: {
        productId: product.id,
        amount: product.minAmount,
        tenorMonths: product.tenors[0],
        purpose: "Buying stock for my shop",
        employmentStatus: "employed",
        employer: "Acme Ltd",
        monthlyIncome: 400_000,
        bvn: "12345678901",
        consent: true,
      },
    });
    expect(application.status).toBe("submitted");

    await login("aurora", "admin");
    const before = await apiFetch<DashboardStats>("/tenants/aurora/lender/dashboard", { tenant: "aurora" });
    const approved = await apiFetch<LoanApplication>(`/tenants/aurora/lender/applications/${application.id}/decision`, {
      method: "POST",
      tenant: "aurora",
      body: { action: "approve", note: "" },
    });
    expect(approved.status).toBe("approved");
    expect(approved.loanId).toBeTruthy();
    const after = await apiFetch<DashboardStats>("/tenants/aurora/lender/dashboard", { tenant: "aurora" });
    expect(after.approvedLoans).toBe(before.approvedLoans + 1);
    expect(after.outstandingBalance).toBeGreaterThan(before.outstandingBalance);

    await login("aurora", "customer");
    const repayment = await apiFetch<{ amount: number }>(`/tenants/aurora/me/loans/${approved.loanId}/repayments`, {
      method: "POST",
      tenant: "aurora",
      body: { amount: 1000, method: "card" },
    });
    expect(repayment.amount).toBe(1000);
  });

  it("validates applications against tenant-specific rules", async () => {
    await login("aurora", "customer");
    const error = await apiFetch("/tenants/aurora/me/applications", {
      method: "POST",
      tenant: "aurora",
      body: { productId: "aurora-personal", amount: 1, tenorMonths: 7, purpose: "short", employmentStatus: "employed", employer: "", monthlyIncome: 1000, bvn: "", consent: false },
    }).catch((caught: ApiError) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect(Object.keys((error as ApiError).fieldErrors)).toEqual(expect.arrayContaining(["amount", "tenorMonths", "purpose", "employer", "bvn", "consent"]));
  });
});
