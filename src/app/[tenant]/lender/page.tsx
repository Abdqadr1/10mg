"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, FileClock, Percent, Users, Wallet, HandCoins } from "lucide-react";
import { ErrorState } from "@/components/feedback/error-state";
import { StatCard, StatCardSkeleton } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/features/lender/api";
import { PortfolioChart } from "@/features/lender/portfolio-chart";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { formatDate, formatPercent, formatRelative, titleCase } from "@/lib/format";
import { useSession } from "@/stores/auth-store";

export default function LenderDashboard() {
  const tenant = useTenant();
  const money = useMoney();
  const session = useSession(tenant.slug);
  const { data, isPending, error, refetch } = useDashboard();
  const base = `/${tenant.slug}/lender`;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session?.user.name.split(" ")[0] ?? "there"}`}
        description={data ? `Portfolio overview for ${tenant.name} · ${formatPercent(data.approvalRate, 0)} approval rate` : `Portfolio overview for ${tenant.name}`}
        actions={
          <Link href={`${base}/applications`} className={buttonVariants()}>
            Review applications
            {data?.pendingApplications ? <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{data.pendingApplications}</span> : null}
          </Link>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {isPending ? (
              Array.from({ length: 8 }, (_, index) => <StatCardSkeleton key={index} />)
            ) : (
              <>
                <StatCard tone="brand" label="Outstanding balance" value={money(data.outstandingBalance, { compact: true })} icon={Wallet} hint={`${data.activeLoans + data.overdueLoans} open loans`} />
                <StatCard label="Total disbursed" value={money(data.totalDisbursed, { compact: true })} icon={Banknote} hint={`${data.approvedLoans} approved loans`} />
                <StatCard label="Collected" value={money(data.totalCollected, { compact: true })} icon={HandCoins} hint="All-time repayments" />
                <StatCard label="Repayment rate" value={formatPercent(data.repaymentRate)} icon={Percent} hint="Collected vs. due to date" />
                <StatCard label="Pending applications" value={data.pendingApplications} icon={FileClock} hint={<Link href={`${base}/applications`} className="text-primary hover:underline">Open review queue</Link>} />
                <StatCard label="Customers" value={data.totalCustomers} icon={Users} hint="Registered borrowers" />
                <StatCard label="Active loans" value={data.activeLoans} icon={CheckCircle2} hint="Current on repayments" />
                <StatCard tone={data.overdueLoans ? "warning" : "default"} label="Overdue loans" value={data.overdueLoans} icon={AlertTriangle} hint="Missed an instalment" />
              </>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Disbursements vs. collections</CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>{isPending ? <Skeleton className="h-72 w-full" /> : <PortfolioChart data={data.series} />}</CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Latest applications</CardTitle>
                <CardAction>
                  <Link href={`${base}/applications`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    View all <ArrowRight />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ul className="divide-y">
                    {data.recentApplications.map((application) => (
                      <li key={application.id}>
                        <Link href={`${base}/applications?review=${application.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{application.customerName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {application.productName} · {formatRelative(application.submittedAt)}
                            </p>
                          </div>
                          <span className="text-sm font-medium tabular-nums">{money(application.amount, { compact: true })}</span>
                          <StatusBadge status={application.status} className="hidden sm:inline-flex" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent repayments</CardTitle>
                <CardAction>
                  <Link href={`${base}/repayments`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    View all <ArrowRight />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ul className="divide-y">
                    {data.recentRepayments.map((repayment) => (
                      <li key={repayment.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{repayment.customerName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {titleCase(repayment.method)} · {formatDate(repayment.paidAt)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-emerald-700 tabular-nums">+{money(repayment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
