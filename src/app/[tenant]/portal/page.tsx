"use client";

import Link from "next/link";
import { CalendarClock, FilePlus2, Wallet } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { StatusTimeline } from "@/components/data/status-timeline";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoanCard } from "@/features/loans/loan-card";
import { useOverview } from "@/features/portal/api";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { formatDate, formatMonths } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PortalOverview() {
  const tenant = useTenant();
  const money = useMoney();
  const { data, isPending, error, refetch } = useOverview();
  const base = `/${tenant.slug}/portal`;

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const openLoans = data.loans.filter((loan) => loan.status !== "repaid");
  const focusLoan = [...openLoans].sort((a, b) => (a.status === "overdue" ? -1 : b.status === "overdue" ? 1 : (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? "")))[0];
  const pendingApplication = data.applications.find((app) => app.status === "submitted" || app.status === "under_review");
  const totalRepaid = data.loans.reduce((sum, loan) => sum + loan.amountPaid, 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${data.customer.firstName}`}
        description={`Here's where things stand with ${tenant.name}.`}
        actions={
          <Link href={`${base}/apply`} className={buttonVariants()}>
            <FilePlus2 />
            New application
          </Link>
        }
      />

      {focusLoan ? (
        <Card className={cn("ring-0", focusLoan.status === "overdue" ? "bg-red-700 text-white" : "bg-primary text-primary-foreground")}>
          <CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Wallet className="size-4" />
                {focusLoan.productName} · {focusLoan.id}
              </div>
              <div>
                <p className="text-sm opacity-80">{focusLoan.status === "overdue" ? "Overdue amount" : "Next payment"}</p>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">{money(focusLoan.amountDueNow)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm opacity-80">
                  <CalendarClock className="size-4" />
                  {focusLoan.status === "overdue" ? "Please pay as soon as possible to avoid penalties" : `Due ${formatDate(focusLoan.nextDueDate, "long")}`}
                </p>
              </div>
              <p className="text-sm opacity-80">
                {money(focusLoan.outstanding)} outstanding of {money(focusLoan.totalRepayable)}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link href={`${base}/loans/${focusLoan.id}?pay=1`} className={cn(buttonVariants({ size: "lg" }), "h-11 bg-background px-6 text-foreground hover:bg-background/90")}>
                Make a payment
              </Link>
              <Link href={`${base}/loans/${focusLoan.id}`} className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-11 text-inherit hover:bg-white/10 hover:text-inherit")}>
                View schedule
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        !pendingApplication && (
          <EmptyState
            icon={FilePlus2}
            title="You have no active loans"
            description={`Apply for ${tenant.products.map((product) => product.name).join(" or ")} in a few minutes.`}
            action={
              <Link href={`${base}/apply`} className={buttonVariants()}>
                Start an application
              </Link>
            }
          />
        )
      )}

      {pendingApplication && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Application in progress <StatusBadge status={pendingApplication.status} />
            </CardTitle>
            <CardDescription>
              {pendingApplication.productName} · {money(pendingApplication.amount)} over {formatMonths(pendingApplication.tenorMonths)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusTimeline application={pendingApplication} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">Total borrowed</p>
            <p className="text-xl font-semibold tabular-nums">{money(data.loans.reduce((sum, loan) => sum + loan.principal, 0))}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">Total repaid</p>
            <p className="text-xl font-semibold tabular-nums">{money(totalRepaid)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">Loans completed</p>
            <p className="text-xl font-semibold tabular-nums">{data.loans.filter((loan) => loan.status === "repaid").length}</p>
          </CardContent>
        </Card>
      </div>

      {data.loans.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Your loans</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </section>
      )}

      {data.applications.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Application history</h2>
          <Card className="py-0">
            <ul className="divide-y">
              {data.applications.map((application) => (
                <li key={application.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {application.productName} · {money(application.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(application.submittedAt)}
                      {application.decisionNote && ` · “${application.decisionNote}”`}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </>
  );
}
