"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoanCard } from "@/features/loans/loan-card";
import { useOverview } from "@/features/portal/api";
import { useTenant } from "@/features/tenants/tenant-context";

export default function MyLoansPage() {
  const tenant = useTenant();
  const { data, isPending, error, refetch } = useOverview();
  const open = data?.loans.filter((loan) => loan.status !== "repaid") ?? [];
  const closed = data?.loans.filter((loan) => loan.status === "repaid") ?? [];

  return (
    <>
      <PageHeader title="My loans" description="Track balances, schedules and payments for every loan." />
      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No loans yet"
          description="Once an application is approved, your loan will appear here."
          action={
            <Link href={`/${tenant.slug}/portal/apply`} className={buttonVariants()}>
              Apply now
            </Link>
          }
        />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Open ({open.length})</h2>
            {open.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {open.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You have no open loans.</p>
            )}
          </section>
          {closed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Completed ({closed.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {closed.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
