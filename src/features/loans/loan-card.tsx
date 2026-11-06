"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { formatDate, formatMonths } from "@/lib/format";
import type { Loan } from "@/types";
import { LoanProgress } from "./loan-progress";

export function LoanCard({ loan }: { loan: Loan }) {
  const tenant = useTenant();
  const money = useMoney();
  return (
    <Link href={`/${tenant.slug}/portal/loans/${loan.id}`} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{loan.productName}</p>
              <p className="text-xs text-muted-foreground">
                {money(loan.principal)} · {formatMonths(loan.tenorMonths)} · disbursed {formatDate(loan.disbursedAt)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge status={loan.status} />
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>
          <LoanProgress loan={loan} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Outstanding</span>
            <span className="font-semibold tabular-nums">{money(loan.outstanding)}</span>
          </div>
          {loan.status !== "repaid" && loan.nextDueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next payment</span>
              <span className={loan.status === "overdue" ? "font-medium text-red-700" : ""}>
                {money(loan.amountDueNow)} {loan.status === "overdue" ? "overdue" : `by ${formatDate(loan.nextDueDate)}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
