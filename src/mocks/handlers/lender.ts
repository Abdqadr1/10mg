import { HttpResponse, http } from "msw";
import { estimateRepayment, roundMoney, summarizeLoan } from "@/lib/finance";
import { decisionSchema } from "@/lib/schemas";
import type { ApplicationReview, CustomerOverview, DashboardStats, LoanRecord, MonthlyPoint } from "@/types";
import { createId, db, now, persist, tenantRecords, toApplication, toCustomerSummary, toLoan, toLoanDetail, toRepayment } from "../db";
import { API, errorResponse, guard, latency, parseBody } from "./utils";

const MONTHS_IN_CHART = 6;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildSeries(loans: LoanRecord[], repayments: { amount: number; paidAt: string }[], today: Date): MonthlyPoint[] {
  const points = new Map<string, MonthlyPoint>();
  for (let offset = MONTHS_IN_CHART - 1; offset >= 0; offset--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1));
    points.set(monthKey(date), {
      month: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date),
      disbursed: 0,
      collected: 0,
    });
  }
  for (const loan of loans) {
    const point = points.get(monthKey(new Date(loan.disbursedAt)));
    if (point) point.disbursed = roundMoney(point.disbursed + loan.principal);
  }
  for (const repayment of repayments) {
    const point = points.get(monthKey(new Date(repayment.paidAt)));
    if (point) point.collected = roundMoney(point.collected + repayment.amount);
  }
  return [...points.values()];
}

export const lenderHandlers = [
  http.get(`${API}/tenants/:slug/lender/dashboard`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const { tenant } = auth;
    const today = now();
    const records = tenantRecords(tenant.id);
    const loans = records.loans.map((loan) => toLoan(loan, tenant));
    const dueToDate = records.loans.reduce((sum, loan) => {
      const { schedule } = summarizeLoan(loan, today);
      return sum + schedule.filter((row) => new Date(row.dueDate) <= today).reduce((total, row) => total + row.payment, 0);
    }, 0);
    const collectedOnSchedule = loans.reduce((sum, loan) => sum + loan.amountPaid, 0);
    const decided = records.applications.filter((app) => app.status === "approved" || app.status === "rejected");

    const stats: DashboardStats = {
      totalCustomers: records.customers.length,
      pendingApplications: records.applications.filter((app) => app.status === "submitted" || app.status === "under_review").length,
      approvedLoans: loans.length,
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      overdueLoans: loans.filter((loan) => loan.status === "overdue").length,
      totalDisbursed: roundMoney(loans.reduce((sum, loan) => sum + loan.principal, 0)),
      outstandingBalance: roundMoney(loans.reduce((sum, loan) => sum + loan.outstanding, 0)),
      totalCollected: roundMoney(records.repayments.reduce((sum, item) => sum + item.amount, 0)),
      repaymentRate: dueToDate > 0 ? Math.min(collectedOnSchedule / dueToDate, 1) : 1,
      approvalRate: decided.length ? decided.filter((app) => app.status === "approved").length / decided.length : 0,
      series: buildSeries(records.loans, records.repayments, today),
      recentApplications: records.applications.slice(0, 5).map((app) => toApplication(app, tenant)),
      recentRepayments: records.repayments.slice(0, 6).map(toRepayment),
    };
    return HttpResponse.json(stats);
  }),

  http.get(`${API}/tenants/:slug/lender/applications`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    return HttpResponse.json(tenantRecords(auth.tenant.id).applications.map((app) => toApplication(app, auth.tenant)));
  }),

  http.get(`${API}/tenants/:slug/lender/applications/:id`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const { tenant } = auth;
    const records = tenantRecords(tenant.id);
    const application = records.applications.find((app) => app.id === params.id);
    if (!application) return errorResponse(404, "Application not found");
    const customer = records.customers.find((item) => item.id === application.customerId);
    if (!customer) return errorResponse(404, "Customer not found");
    const estimate = estimateRepayment(application.amount, application.interestRate, application.tenorMonths);
    const existingLoans = records.loans
      .filter((loan) => loan.customerId === customer.id && loan.applicationId !== application.id)
      .map((loan) => toLoan(loan, tenant));
    const existingMonthly = existingLoans.filter((loan) => loan.status !== "repaid").reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    const review: ApplicationReview = {
      application: toApplication(application, tenant),
      customer,
      estimate,
      debtToIncome: application.monthlyIncome > 0 ? (estimate.monthlyPayment + existingMonthly) / application.monthlyIncome : 1,
      existingLoans,
      previousApplications: records.applications
        .filter((app) => app.customerId === customer.id && app.id !== application.id)
        .map((app) => toApplication(app, tenant)),
    };
    return HttpResponse.json(review);
  }),

  http.post(`${API}/tenants/:slug/lender/applications/:id/decision`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const { tenant } = auth;
    const application = db().applications.find((app) => app.tenantId === tenant.id && app.id === params.id);
    if (!application) return errorResponse(404, "Application not found");
    const parsed = await parseBody(request, decisionSchema);
    if (parsed.error) return parsed.error;
    const { action, note } = parsed.data;
    const timestamp = now().toISOString();

    if (action === "start_review") {
      if (application.status !== "submitted") return errorResponse(409, "Only new applications can be moved to review");
      application.status = "under_review";
      application.reviewedAt = timestamp;
    } else {
      if (application.status !== "submitted" && application.status !== "under_review") {
        return errorResponse(409, "This application has already been decided");
      }
      application.reviewedAt ??= timestamp;
      application.decidedAt = timestamp;
      application.decisionNote = note || null;
      application.status = action === "approve" ? "approved" : "rejected";
      if (action === "approve") {
        const loan: LoanRecord = {
          id: createId(`${tenant.slug}-loan`),
          tenantId: tenant.id,
          customerId: application.customerId,
          applicationId: application.id,
          productId: application.productId,
          principal: application.amount,
          interestRate: application.interestRate,
          tenorMonths: application.tenorMonths,
          disbursedAt: timestamp,
          amountPaid: 0,
        };
        db().loans.unshift(loan);
        application.loanId = loan.id;
      }
    }
    persist();
    return HttpResponse.json(toApplication(application, tenant));
  }),

  http.get(`${API}/tenants/:slug/lender/customers`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    return HttpResponse.json(tenantRecords(auth.tenant.id).customers.map((customer) => toCustomerSummary(customer, auth.tenant)));
  }),

  http.get(`${API}/tenants/:slug/lender/customers/:id`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const records = tenantRecords(auth.tenant.id);
    const customer = records.customers.find((item) => item.id === params.id);
    if (!customer) return errorResponse(404, "Customer not found");
    const overview: CustomerOverview = {
      customer,
      loans: records.loans.filter((loan) => loan.customerId === customer.id).map((loan) => toLoan(loan, auth.tenant)),
      applications: records.applications.filter((app) => app.customerId === customer.id).map((app) => toApplication(app, auth.tenant)),
    };
    return HttpResponse.json(overview);
  }),

  http.get(`${API}/tenants/:slug/lender/loans`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    return HttpResponse.json(tenantRecords(auth.tenant.id).loans.map((loan) => toLoan(loan, auth.tenant)));
  }),

  http.get(`${API}/tenants/:slug/lender/loans/:id`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const loan = tenantRecords(auth.tenant.id).loans.find((item) => item.id === params.id);
    if (!loan) return errorResponse(404, "Loan not found");
    return HttpResponse.json(toLoanDetail(loan, auth.tenant));
  }),

  http.get(`${API}/tenants/:slug/lender/repayments`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    return HttpResponse.json(tenantRecords(auth.tenant.id).repayments.map(toRepayment));
  }),
];
