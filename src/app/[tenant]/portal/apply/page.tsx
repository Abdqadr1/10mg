"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Hourglass, Lock } from "lucide-react";
import { StatusTimeline } from "@/components/data/status-timeline";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverview } from "@/features/portal/api";
import { ApplicationForm } from "@/features/portal/application-form";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import type { LoanApplication } from "@/types";

function numberParam(value: string | null) {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : null;
}

function ApplyView() {
  const tenant = useTenant();
  const money = useMoney();
  const searchParams = useSearchParams();
  const { data, isPending, error, refetch } = useOverview();
  const [submitted, setSubmitted] = useState<LoanApplication | null>(null);
  const portal = `/${tenant.slug}/portal`;

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-6 py-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Application received</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve received your request for {money(submitted.amount)}. {tenant.name} will review it shortly. Reference <span className="font-mono">{submitted.id}</span>.
            </p>
          </div>
          <StatusTimeline application={submitted} className="text-left" />
          <Link href={portal} className={buttonVariants({ size: "lg" })}>
            Back to overview
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const pending = data.applications.find((app) => app.status === "submitted" || app.status === "under_review");
  if (pending) {
    return (
      <EmptyState
        icon={Hourglass}
        title="You already have an application in progress"
        description={`Your ${pending.productName} request for ${money(pending.amount)} is being reviewed. You can apply again once a decision is made.`}
        action={
          <Link href={portal} className={buttonVariants()}>
            Track application
          </Link>
        }
      />
    );
  }

  const openLoans = data.loans.filter((loan) => loan.status !== "repaid").length;
  if (openLoans >= tenant.settings.maxActiveLoans) {
    return (
      <EmptyState
        icon={Lock}
        title="You've reached your loan limit"
        description={`${tenant.name} allows up to ${tenant.settings.maxActiveLoans} open loan(s) at a time. Repay an existing loan to apply again.`}
        action={
          <Link href={`${portal}/loans`} className={buttonVariants()}>
            View my loans
          </Link>
        }
      />
    );
  }

  return (
    <ApplicationForm
      customer={data.customer}
      initial={{ productId: searchParams.get("product"), amount: numberParam(searchParams.get("amount")), tenor: numberParam(searchParams.get("tenor")) }}
      onSubmitted={setSubmitted}
    />
  );
}

export default function ApplyPage() {
  const tenant = useTenant();
  return (
    <>
      <PageHeader title="Apply for a loan" description={`Takes about 3 minutes. Your information is shared only with ${tenant.name}.`} />
      <Suspense>
        <ApplyView />
      </Suspense>
    </>
  );
}
