"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { RepaymentHistory } from "@/features/loans/repayment-history";
import { useMyRepayments } from "@/features/portal/api";
import { useMoney } from "@/features/tenants/tenant-context";

export default function MyRepaymentsPage() {
  const money = useMoney();
  const { data, isPending, error, refetch } = useMyRepayments();
  const total = data?.reduce((sum, repayment) => sum + repayment.amount, 0) ?? 0;

  return (
    <>
      <PageHeader title="Repayment history" description={data ? `${data.length} payments · ${money(total)} paid in total` : "Every payment you've made"} />
      {isPending ? <Skeleton className="h-80 w-full" /> : error ? <ErrorState error={error} onRetry={() => refetch()} /> : <RepaymentHistory repayments={data} showLoan />}
    </>
  );
}
