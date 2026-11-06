"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { StatusTimeline } from "@/components/data/status-timeline";
import { ErrorState } from "@/components/feedback/error-state";
import { NotFoundState } from "@/components/feedback/not-found-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanSummary } from "@/features/loans/loan-summary";
import { RepaymentHistory } from "@/features/loans/repayment-history";
import { ScheduleTable } from "@/features/loans/schedule-table";
import { useMyLoan } from "@/features/portal/api";
import { RepaymentDialog } from "@/features/portal/repayment-dialog";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { isApiError } from "@/lib/api/client";
import { formatMonths } from "@/lib/format";

function LoanDetailView() {
  const tenant = useTenant();
  const money = useMoney();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const payOpen = useSearchParams().get("pay") === "1";
  const { data: loan, isPending, error, refetch } = useMyLoan(id);
  const backHref = `/${tenant.slug}/portal/loans`;

  const setPayOpen = (open: boolean) => router.replace(open ? `${pathname}?pay=1` : pathname, { scroll: false });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (error) {
    if (isApiError(error) && error.status === 404) return <NotFoundState title="Loan not found" description="This loan doesn't exist or belongs to another account." href={backHref} cta="Back to my loans" />;
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <>
      <div className="space-y-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          My loans
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{loan.productName}</h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {money(loan.principal)} over {formatMonths(loan.tenorMonths)} · {loan.id}
            </p>
          </div>
          {loan.status !== "repaid" && (
            <Button size="lg" className="h-10" onClick={() => setPayOpen(true)}>
              Make a repayment
            </Button>
          )}
        </div>
      </div>

      {loan.status === "overdue" && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          You have {money(loan.amountDueNow)} overdue. Please make a payment to bring your loan up to date.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent>
            <LoanSummary loan={loan} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loan journey</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline application={loan.application} loan={loan} orientation="vertical" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Repayment schedule</TabsTrigger>
          <TabsTrigger value="history">Payment history ({loan.repayments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="pt-3">
          <ScheduleTable schedule={loan.schedule} />
        </TabsContent>
        <TabsContent value="history" className="pt-3">
          <RepaymentHistory repayments={loan.repayments} />
        </TabsContent>
      </Tabs>

      <RepaymentDialog loan={loan} open={payOpen && loan.status !== "repaid"} onOpenChange={setPayOpen} />
    </>
  );
}

export default function LoanDetailPage() {
  return (
    <Suspense>
      <LoanDetailView />
    </Suspense>
  );
}
