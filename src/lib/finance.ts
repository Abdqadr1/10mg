import type { Installment, InstallmentStatus, LoanRecord, LoanStatus } from "@/types";

const EPSILON = 0.005;

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMonths(isoDate: string, months: number) {
  const date = new Date(isoDate);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

export function calculateMonthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const rate = annualRate / 100 / 12;
  if (rate === 0) return roundMoney(principal / months);
  return roundMoney((principal * rate) / (1 - Math.pow(1 + rate, -months)));
}

export interface ScheduleRow {
  index: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function buildSchedule(principal: number, annualRate: number, months: number, startDate: string): ScheduleRow[] {
  const rate = annualRate / 100 / 12;
  const payment = calculateMonthlyPayment(principal, annualRate, months);
  const rows: ScheduleRow[] = [];
  let balance = principal;

  for (let index = 1; index <= months; index++) {
    const interest = roundMoney(balance * rate);
    const isLast = index === months;
    const principalPart = isLast ? roundMoney(balance) : roundMoney(payment - interest);
    balance = isLast ? 0 : roundMoney(balance - principalPart);
    rows.push({
      index,
      dueDate: addMonths(startDate, index),
      payment: roundMoney(principalPart + interest),
      principal: principalPart,
      interest,
      balance,
    });
  }

  return rows;
}

export function estimateRepayment(principal: number, annualRate: number, months: number) {
  const schedule = buildSchedule(principal, annualRate, months, new Date(0).toISOString());
  const totalRepayable = roundMoney(schedule.reduce((sum, row) => sum + row.payment, 0));
  return {
    monthlyPayment: calculateMonthlyPayment(principal, annualRate, months),
    totalRepayable,
    totalInterest: roundMoney(totalRepayable - principal),
  };
}

export interface LoanSummary {
  schedule: Installment[];
  status: LoanStatus;
  monthlyPayment: number;
  totalRepayable: number;
  outstanding: number;
  amountDueNow: number;
  nextDueDate: string | null;
  paidInstallments: number;
}

export function summarizeLoan(loan: Pick<LoanRecord, "principal" | "interestRate" | "tenorMonths" | "disbursedAt" | "amountPaid">, now: Date = new Date()): LoanSummary {
  const rows = buildSchedule(loan.principal, loan.interestRate, loan.tenorMonths, loan.disbursedAt);
  const totalRepayable = roundMoney(rows.reduce((sum, row) => sum + row.payment, 0));
  let remaining = loan.amountPaid;
  let nextAssigned = false;

  const schedule: Installment[] = rows.map((row) => {
    const paid = roundMoney(Math.min(row.payment, Math.max(remaining, 0)));
    remaining = roundMoney(remaining - paid);
    const settled = paid >= row.payment - EPSILON;
    const pastDue = new Date(row.dueDate).getTime() < now.getTime();
    let status: InstallmentStatus;
    if (settled) status = "paid";
    else if (pastDue) status = "overdue";
    else if (!nextAssigned) {
      status = paid > 0 ? "partial" : "due";
      nextAssigned = true;
    } else status = "upcoming";
    return { ...row, paid, status };
  });

  const outstanding = roundMoney(Math.max(totalRepayable - loan.amountPaid, 0));
  const amountDueNow = roundMoney(
    schedule
      .filter((row) => row.status === "overdue" || row.status === "due" || row.status === "partial")
      .reduce((sum, row) => sum + (row.payment - row.paid), 0),
  );
  const firstOpen = schedule.find((row) => row.status !== "paid");
  const hasOverdue = schedule.some((row) => row.status === "overdue");

  return {
    schedule,
    status: outstanding <= EPSILON ? "repaid" : hasOverdue ? "overdue" : "active",
    monthlyPayment: calculateMonthlyPayment(loan.principal, loan.interestRate, loan.tenorMonths),
    totalRepayable,
    outstanding,
    amountDueNow,
    nextDueDate: firstOpen?.dueDate ?? null,
    paidInstallments: schedule.filter((row) => row.status === "paid").length,
  };
}

export function maxRepaymentAmount(summary: Pick<LoanSummary, "outstanding" | "amountDueNow">, allowEarlyRepayment: boolean) {
  return allowEarlyRepayment ? summary.outstanding : Math.min(summary.amountDueNow, summary.outstanding);
}
