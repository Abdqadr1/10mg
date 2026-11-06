import { describe, expect, it } from "vitest";
import { buildSchedule, calculateMonthlyPayment, estimateRepayment, maxRepaymentAmount, summarizeLoan } from "@/lib/finance";

describe("calculateMonthlyPayment", () => {
  it("amortises principal with monthly compounding", () => {
    expect(calculateMonthlyPayment(100_000, 12, 12)).toBeCloseTo(8884.88, 2);
  });

  it("splits evenly when the rate is zero", () => {
    expect(calculateMonthlyPayment(1200, 0, 12)).toBe(100);
  });
});

describe("buildSchedule", () => {
  it("fully repays the principal and ends at a zero balance", () => {
    const schedule = buildSchedule(250_000, 24, 6, "2026-01-31T00:00:00.000Z");
    const principalPaid = schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(schedule).toHaveLength(6);
    expect(principalPaid).toBeCloseTo(250_000, 2);
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it("clamps due dates to the end of shorter months", () => {
    const schedule = buildSchedule(1000, 10, 2, "2026-01-31T00:00:00.000Z");
    expect(schedule[0].dueDate.slice(0, 10)).toBe("2026-02-28");
    expect(schedule[1].dueDate.slice(0, 10)).toBe("2026-03-31");
  });
});

describe("summarizeLoan", () => {
  const loan = { principal: 120_000, interestRate: 24, tenorMonths: 6, disbursedAt: "2026-01-01T00:00:00.000Z", amountPaid: 0 };
  const { monthlyPayment, totalRepayable } = estimateRepayment(120_000, 24, 6);

  it("marks past-due unpaid instalments as overdue", () => {
    const summary = summarizeLoan(loan, new Date("2026-03-15T00:00:00.000Z"));
    expect(summary.status).toBe("overdue");
    expect(summary.schedule.slice(0, 2).every((row) => row.status === "overdue")).toBe(true);
    expect(summary.schedule[2].status).toBe("due");
    expect(summary.amountDueNow).toBeCloseTo(monthlyPayment * 3, 0);
  });

  it("allocates payments sequentially and stays active when current", () => {
    const summary = summarizeLoan({ ...loan, amountPaid: monthlyPayment * 2 + 100 }, new Date("2026-03-15T00:00:00.000Z"));
    expect(summary.status).toBe("active");
    expect(summary.paidInstallments).toBe(2);
    expect(summary.schedule[2].status).toBe("partial");
    expect(summary.outstanding).toBeCloseTo(totalRepayable - (monthlyPayment * 2 + 100), 2);
  });

  it("reports repaid once the full amount is settled", () => {
    const summary = summarizeLoan({ ...loan, amountPaid: totalRepayable }, new Date("2026-12-01T00:00:00.000Z"));
    expect(summary.status).toBe("repaid");
    expect(summary.outstanding).toBe(0);
    expect(summary.nextDueDate).toBeNull();
  });

  it("caps repayments at the amount due when early repayment is disabled", () => {
    const summary = summarizeLoan(loan, new Date("2026-01-15T00:00:00.000Z"));
    expect(maxRepaymentAmount(summary, false)).toBeCloseTo(monthlyPayment, 2);
    expect(maxRepaymentAmount(summary, true)).toBeCloseTo(totalRepayable, 2);
  });
});
