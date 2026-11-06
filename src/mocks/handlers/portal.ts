import { HttpResponse, http } from "msw";
import { maxRepaymentAmount, roundMoney, summarizeLoan } from "@/lib/finance";
import { createApplicationSchema, createRepaymentSchema } from "@/lib/schemas";
import type { CustomerOverview } from "@/types";
import { createId, db, now, persist, tenantRecords, toApplication, toLoan, toLoanDetail, toRepayment } from "../db";
import type { ApplicationRecord, RepaymentRecord } from "../types";
import { API, errorResponse, guard, latency, parseBody } from "./utils";

function customerGuard(request: Request, slug: string | readonly string[] | undefined) {
  const auth = guard(request, slug, "customer");
  if (auth.error) return auth;
  const customer = db().customers.find((item) => item.id === auth.user.customerId);
  if (!customer) return { error: errorResponse(404, "Customer profile not found") };
  return { ...auth, customer };
}

export const portalHandlers = [
  http.get(`${API}/tenants/:slug/me/overview`, async ({ request, params }) => {
    await latency();
    const auth = customerGuard(request, params.slug);
    if (auth.error) return auth.error;
    const records = tenantRecords(auth.tenant.id);
    const overview: CustomerOverview = {
      customer: auth.customer,
      loans: records.loans.filter((loan) => loan.customerId === auth.customer.id).map((loan) => toLoan(loan, auth.tenant)),
      applications: records.applications.filter((app) => app.customerId === auth.customer.id).map((app) => toApplication(app, auth.tenant)),
    };
    return HttpResponse.json(overview);
  }),

  http.post(`${API}/tenants/:slug/me/applications`, async ({ request, params }) => {
    await latency();
    const auth = customerGuard(request, params.slug);
    if (auth.error) return auth.error;
    const { tenant, customer } = auth;
    const parsed = await parseBody(request, createApplicationSchema(tenant));
    if (parsed.error) return parsed.error;
    const records = tenantRecords(tenant.id);
    const hasPending = records.applications.some(
      (app) => app.customerId === customer.id && (app.status === "submitted" || app.status === "under_review"),
    );
    if (hasPending) return errorResponse(409, "You already have an application being processed. Please wait for a decision.");
    const openLoans = records.loans.filter(
      (loan) => loan.customerId === customer.id && summarizeLoan(loan, now()).status !== "repaid",
    ).length;
    if (openLoans >= tenant.settings.maxActiveLoans) {
      return errorResponse(409, `${tenant.name} allows at most ${tenant.settings.maxActiveLoans} active loan(s) per customer.`);
    }
    const input = parsed.data;
    const product = tenant.products.find((item) => item.id === input.productId)!;
    Object.assign(customer, {
      employmentStatus: input.employmentStatus,
      employer: input.employer,
      monthlyIncome: input.monthlyIncome,
    });
    const application: ApplicationRecord = {
      id: createId(`${tenant.slug}-app`),
      tenantId: tenant.id,
      customerId: customer.id,
      productId: product.id,
      amount: input.amount,
      tenorMonths: input.tenorMonths,
      interestRate: product.interestRate,
      purpose: input.purpose,
      monthlyIncome: input.monthlyIncome,
      status: "submitted",
      submittedAt: now().toISOString(),
      reviewedAt: null,
      decidedAt: null,
      decisionNote: null,
      loanId: null,
    };
    db().applications.unshift(application);
    persist();
    return HttpResponse.json(toApplication(application, tenant), { status: 201 });
  }),

  http.get(`${API}/tenants/:slug/me/loans/:id`, async ({ request, params }) => {
    await latency();
    const auth = customerGuard(request, params.slug);
    if (auth.error) return auth.error;
    const loan = tenantRecords(auth.tenant.id).loans.find((item) => item.id === params.id && item.customerId === auth.customer.id);
    if (!loan) return errorResponse(404, "Loan not found");
    return HttpResponse.json(toLoanDetail(loan, auth.tenant));
  }),

  http.post(`${API}/tenants/:slug/me/loans/:id/repayments`, async ({ request, params }) => {
    await latency();
    const auth = customerGuard(request, params.slug);
    if (auth.error) return auth.error;
    const { tenant, customer } = auth;
    const loan = db().loans.find((item) => item.tenantId === tenant.id && item.id === params.id && item.customerId === customer.id);
    if (!loan) return errorResponse(404, "Loan not found");
    const summary = summarizeLoan(loan, now());
    if (summary.status === "repaid") return errorResponse(409, "This loan is already fully repaid");
    const parsed = await parseBody(request, createRepaymentSchema(maxRepaymentAmount(summary, tenant.settings.allowEarlyRepayment)));
    if (parsed.error) return parsed.error;
    const repayment: RepaymentRecord = {
      id: createId(`${tenant.slug}-rep`),
      tenantId: tenant.id,
      loanId: loan.id,
      customerId: customer.id,
      amount: roundMoney(parsed.data.amount),
      method: parsed.data.method,
      reference: `RP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      paidAt: now().toISOString(),
    };
    loan.amountPaid = roundMoney(loan.amountPaid + repayment.amount);
    db().repayments.unshift(repayment);
    persist();
    return HttpResponse.json(toRepayment(repayment), { status: 201 });
  }),

  http.get(`${API}/tenants/:slug/me/repayments`, async ({ request, params }) => {
    await latency();
    const auth = customerGuard(request, params.slug);
    if (auth.error) return auth.error;
    return HttpResponse.json(
      tenantRecords(auth.tenant.id)
        .repayments.filter((item) => item.customerId === auth.customer.id)
        .map(toRepayment),
    );
  }),
];
