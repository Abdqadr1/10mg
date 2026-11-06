"use client";

import { DescriptionList } from "@/components/data/description-list";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate } from "@/lib/format";
import type { Loan } from "@/types";
import { LoanProgress } from "./loan-progress";

export function LoanSummary({ loan }: { loan: Loan }) {
  const money = useMoney();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{money(loan.outstanding)}</p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {money(loan.amountPaid)} of {money(loan.totalRepayable)} repaid
          </p>
        </div>
        <LoanProgress loan={loan} />
      </div>
      <DescriptionList
        columns={3}
        items={[
          { label: "Principal", value: money(loan.principal) },
          { label: "Interest rate", value: `${loan.interestRate}% p.a.` },
          { label: "Monthly instalment", value: money(loan.monthlyPayment) },
          { label: "Instalments paid", value: `${loan.paidInstallments} of ${loan.tenorMonths}` },
          { label: "Disbursed", value: formatDate(loan.disbursedAt) },
          { label: "Next due", value: loan.nextDueDate ? formatDate(loan.nextDueDate) : "Fully repaid" },
        ]}
      />
    </div>
  );
}
