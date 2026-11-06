import { fakerEN_NG, type Faker } from "@faker-js/faker";
import { buildSchedule, roundMoney } from "@/lib/finance";
import type { Customer, EmploymentStatus, LoanProduct, LoanRecord, RepaymentMethod, Tenant } from "@/types";
import type { ApplicationRecord, DbState, RepaymentRecord } from "@/mocks/types";
import { DEMO_PASSWORD, SEED_TENANTS, demoCredentials } from "./tenants";

const DAY = 86_400_000;
const KENYAN_FIRST_NAMES = ["Wanjiru", "Otieno", "Achieng", "Kamau", "Njeri", "Mwangi", "Akinyi", "Kiprop", "Chebet", "Omondi", "Wambui", "Mutua"];
const KENYAN_LAST_NAMES = ["Kariuki", "Odhiambo", "Kimani", "Wekesa", "Mutiso", "Njoroge", "Ochieng", "Kiplagat", "Muthoni", "Langat"];
const PURPOSES = [
  "Restocking inventory ahead of the festive season",
  "Paying school fees for the new term",
  "Purchasing a delivery motorbike for the business",
  "Medical bills for a family member",
  "Rent renewal for my apartment",
  "Expanding my tailoring workshop",
  "Buying a solar power system for my shop",
  "Consolidating existing debts",
];
const EMPLOYMENT: EmploymentStatus[] = ["employed", "employed", "self_employed", "business_owner"];
const METHODS: RepaymentMethod[] = ["bank_transfer", "card", "direct_debit"];

function iso(time: number) {
  return new Date(time).toISOString();
}

function roundAmount(value: number, product: LoanProduct) {
  const step = product.maxAmount >= 1_000_000 ? 10_000 : product.maxAmount >= 200_000 ? 5_000 : 1_000;
  return Math.min(product.maxAmount, Math.max(product.minAmount, Math.round(value / step) * step));
}

function personName(faker: Faker, tenant: Pick<Tenant, "settings">) {
  if (tenant.settings.currency === "KES") {
    return { firstName: faker.helpers.arrayElement(KENYAN_FIRST_NAMES), lastName: faker.helpers.arrayElement(KENYAN_LAST_NAMES) };
  }
  return { firstName: faker.person.firstName(), lastName: faker.person.lastName() };
}

interface LoanPlan {
  disbursedAt: number;
  missedInstallments: number;
}

export function generateSeed(now: Date = new Date(), seed = 2026): DbState {
  const faker = fakerEN_NG;
  faker.seed(seed);
  const nowMs = now.getTime();
  const state: DbState = { version: 1, tenants: [], users: [], customers: [], applications: [], loans: [], repayments: [] };

  for (const definition of SEED_TENANTS) {
    const tenant: Tenant = { ...definition, createdAt: iso(nowMs - 420 * DAY) };
    state.tenants.push(tenant);
    const slug = tenant.slug;
    const credentials = demoCredentials(slug);
    let appCounter = 0;
    let loanCounter = 0;
    let repaymentCounter = 0;

    const adminName = personName(faker, tenant);
    state.users.push({
      id: `${slug}-usr-admin`,
      tenantId: tenant.id,
      name: `${adminName.firstName} ${adminName.lastName}`,
      email: credentials.admin.email,
      password: DEMO_PASSWORD,
      role: "lender_admin",
      customerId: null,
    });

    const customers: Customer[] = Array.from({ length: 24 }, (_, index) => {
      const { firstName, lastName } = personName(faker, tenant);
      const isDemo = index === 0;
      const employmentStatus = isDemo ? "employed" : faker.helpers.arrayElement(EMPLOYMENT);
      return {
        id: `${slug}-cus-${String(index + 1).padStart(3, "0")}`,
        tenantId: tenant.id,
        firstName,
        lastName,
        email: isDemo ? credentials.customer.email : faker.internet.email({ firstName, lastName, provider: `${slug}mail.demo` }).toLowerCase(),
        phone: tenant.settings.currency === "KES" ? `+254 7${faker.string.numeric(2)} ${faker.string.numeric(3)} ${faker.string.numeric(3)}` : faker.phone.number(),
        employmentStatus,
        employer: employmentStatus === "self_employed" ? "" : faker.company.name(),
        monthlyIncome: roundMoney(faker.number.int({ min: 8, max: 120 }) * (tenant.settings.currency === "KES" ? 2_500 : 10_000)),
        createdAt: iso(nowMs - faker.number.int({ min: 30, max: 400 }) * DAY),
      };
    });
    state.customers.push(...customers);

    const demo = customers[0];
    state.users.push({
      id: `${slug}-usr-customer`,
      tenantId: tenant.id,
      name: `${demo.firstName} ${demo.lastName}`,
      email: demo.email,
      password: DEMO_PASSWORD,
      role: "customer",
      customerId: demo.id,
    });

    const addApplication = (
      customer: Customer,
      product: LoanProduct,
      submittedAt: number,
      status: ApplicationRecord["status"],
      overrides: Partial<Pick<ApplicationRecord, "amount" | "tenorMonths">> = {},
      plan?: LoanPlan,
    ) => {
      appCounter += 1;
      const amount = overrides.amount ?? roundAmount(faker.number.float({ min: product.minAmount, max: product.minAmount + (product.maxAmount - product.minAmount) * 0.6 }), product);
      const tenorMonths = overrides.tenorMonths ?? faker.helpers.arrayElement(product.tenors);
      const decided = status === "approved" || status === "rejected";
      const application: ApplicationRecord = {
        id: `${slug}-app-${String(appCounter).padStart(4, "0")}`,
        tenantId: tenant.id,
        customerId: customer.id,
        productId: product.id,
        amount,
        tenorMonths,
        interestRate: product.interestRate,
        purpose: faker.helpers.arrayElement(PURPOSES),
        monthlyIncome: customer.monthlyIncome,
        status,
        submittedAt: iso(submittedAt),
        reviewedAt: status === "submitted" ? null : iso(submittedAt + DAY / 2),
        decidedAt: decided ? iso(submittedAt + DAY) : null,
        decisionNote: status === "rejected" ? faker.helpers.arrayElement(["Debt-to-income ratio exceeds policy limit", "Unable to verify employment", "Insufficient credit history"]) : null,
        loanId: null,
      };

      if (status === "approved") {
        loanCounter += 1;
        const disbursedAt = plan?.disbursedAt ?? submittedAt + 2 * DAY;
        const loan: LoanRecord = {
          id: `${slug}-loan-${String(loanCounter).padStart(4, "0")}`,
          tenantId: tenant.id,
          customerId: customer.id,
          applicationId: application.id,
          productId: product.id,
          principal: amount,
          interestRate: product.interestRate,
          tenorMonths,
          disbursedAt: iso(disbursedAt),
          amountPaid: 0,
        };
        const dueRows = buildSchedule(amount, product.interestRate, tenorMonths, loan.disbursedAt).filter((row) => new Date(row.dueDate).getTime() <= nowMs);
        const paidRows = dueRows.slice(0, Math.max(0, dueRows.length - (plan?.missedInstallments ?? 0)));
        for (const row of paidRows) {
          repaymentCounter += 1;
          const repayment: RepaymentRecord = {
            id: `${slug}-rep-${String(repaymentCounter).padStart(5, "0")}`,
            tenantId: tenant.id,
            loanId: loan.id,
            customerId: customer.id,
            amount: row.payment,
            method: faker.helpers.arrayElement(METHODS),
            reference: `RP-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`,
            paidAt: iso(new Date(row.dueDate).getTime() - faker.number.int({ min: 0, max: 3 }) * DAY),
          };
          state.repayments.push(repayment);
          loan.amountPaid = roundMoney(loan.amountPaid + row.payment);
        }
        application.loanId = loan.id;
        state.loans.push(loan);
      }
      state.applications.push(application);
    };

    const [mainProduct, secondProduct] = tenant.products;
    addApplication(demo, secondProduct, nowMs - 260 * DAY, "approved", { tenorMonths: Math.min(...secondProduct.tenors), amount: roundAmount(secondProduct.minAmount * 2, secondProduct) }, { disbursedAt: nowMs - 258 * DAY, missedInstallments: 0 });
    addApplication(demo, mainProduct, nowMs - 75 * DAY, "approved", { tenorMonths: mainProduct.tenors[Math.min(1, mainProduct.tenors.length - 1)], amount: roundAmount(mainProduct.minAmount * 3, mainProduct) }, { disbursedAt: nowMs - 73 * DAY, missedInstallments: 0 });

    for (let i = 0; i < 28; i++) {
      const customer = faker.helpers.arrayElement(customers.slice(1));
      const product = faker.helpers.arrayElement(tenant.products);
      const submittedAt = nowMs - faker.number.int({ min: 15, max: 330 }) * DAY;
      const approved = faker.number.float({ min: 0, max: 1 }) < 0.78;
      const behaviour = faker.number.float({ min: 0, max: 1 });
      addApplication(customer, product, submittedAt, approved ? "approved" : "rejected", {}, {
        disbursedAt: submittedAt + 2 * DAY,
        missedInstallments: behaviour < 0.72 ? 0 : behaviour < 0.9 ? 1 : 2,
      });
    }

    const pending: ApplicationRecord["status"][] = ["submitted", "submitted", "submitted", "under_review", "under_review"];
    pending.forEach((status, index) => {
      const customer = customers[index + 1];
      addApplication(customer, faker.helpers.arrayElement(tenant.products), nowMs - faker.number.int({ min: 0, max: 9 }) * DAY - faker.number.int({ min: 1, max: 20 }) * 3_600_000, status);
    });
  }

  state.applications.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  state.repayments.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return state;
}

export { SEED_TENANTS, DEMO_PASSWORD, demoCredentials };
