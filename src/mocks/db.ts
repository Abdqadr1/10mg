import { summarizeLoan } from "@/lib/finance";
import type { Customer, CustomerSummary, Loan, LoanApplication, LoanDetail, LoanRecord, Repayment, Tenant } from "@/types";
import { generateSeed } from "./seed";
import type { ApplicationRecord, DbState, RepaymentRecord } from "./types";

export const STORAGE_KEY = "10mg-credit-db";
const SCHEMA_VERSION = 1;

let state: DbState | null = null;
let clock: () => Date = () => new Date();

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function load(): DbState {
  const store = storage();
  const raw = store?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DbState;
      if (parsed.version === SCHEMA_VERSION) return parsed;
    } catch {
      store?.removeItem(STORAGE_KEY);
    }
  }
  const seeded = generateSeed(clock());
  store?.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function db(): DbState {
  if (!state) state = load();
  return state;
}

export function persist() {
  if (!state) return;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function resetDb(next?: DbState) {
  state = next ?? generateSeed(clock());
  persist();
  return state;
}

export function setClock(next: () => Date) {
  clock = next;
}

export function now() {
  return clock();
}

let idCounter = 0;
export function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function findTenant(slug: string) {
  return db().tenants.find((tenant) => tenant.slug === slug) ?? null;
}

export function customerName(customerId: string) {
  const customer = db().customers.find((item) => item.id === customerId);
  return customer ? `${customer.firstName} ${customer.lastName}` : "Unknown customer";
}

function productName(tenant: Tenant, productId: string) {
  return tenant.products.find((product) => product.id === productId)?.name ?? "Retired product";
}

export function toApplication(record: ApplicationRecord, tenant: Tenant): LoanApplication {
  return { ...record, customerName: customerName(record.customerId), productName: productName(tenant, record.productId) };
}

export function toLoan(record: LoanRecord, tenant: Tenant): Loan {
  const { schedule: _schedule, ...summary } = summarizeLoan(record, now());
  return {
    ...record,
    ...summary,
    customerName: customerName(record.customerId),
    productName: productName(tenant, record.productId),
  };
}

export function toRepayment(record: RepaymentRecord): Repayment {
  return { ...record, customerName: customerName(record.customerId) };
}

export function toLoanDetail(record: LoanRecord, tenant: Tenant): LoanDetail {
  const summary = summarizeLoan(record, now());
  const application = db().applications.find((item) => item.id === record.applicationId);
  if (!application) throw new Error(`Loan ${record.id} has no application`);
  return {
    ...toLoan(record, tenant),
    schedule: summary.schedule,
    repayments: db()
      .repayments.filter((item) => item.loanId === record.id)
      .map(toRepayment),
    application: toApplication(application, tenant),
  };
}

export function toCustomerSummary(customer: Customer, tenant: Tenant): CustomerSummary {
  const loans = db()
    .loans.filter((loan) => loan.customerId === customer.id)
    .map((loan) => toLoan(loan, tenant));
  return {
    ...customer,
    activeLoans: loans.filter((loan) => loan.status !== "repaid").length,
    totalBorrowed: loans.reduce((sum, loan) => sum + loan.principal, 0),
    outstanding: loans.reduce((sum, loan) => sum + loan.outstanding, 0),
  };
}

export function tenantRecords(tenantId: string) {
  const data = db();
  return {
    customers: data.customers.filter((item) => item.tenantId === tenantId),
    applications: data.applications.filter((item) => item.tenantId === tenantId),
    loans: data.loans.filter((item) => item.tenantId === tenantId),
    repayments: data.repayments.filter((item) => item.tenantId === tenantId),
  };
}
