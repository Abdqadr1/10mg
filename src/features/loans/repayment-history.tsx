"use client";

import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate, titleCase } from "@/lib/format";
import type { Repayment } from "@/types";

export function RepaymentHistory({ repayments, showLoan = false }: { repayments: Repayment[]; showLoan?: boolean }) {
  const money = useMoney();
  if (!repayments.length) {
    return <EmptyState icon={Receipt} title="No repayments yet" description="Payments will appear here as soon as they are received." />;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {repayments.map((repayment) => (
        <li key={repayment.id} className="flex items-center gap-3 px-3 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Receipt className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{formatDate(repayment.paidAt)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {titleCase(repayment.method)} · {repayment.reference}
              {showLoan && ` · ${repayment.loanId}`}
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-700 tabular-nums">{money(repayment.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
