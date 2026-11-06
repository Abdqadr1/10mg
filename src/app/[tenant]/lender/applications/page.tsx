"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApplications } from "@/features/lender/api";
import { ApplicationReviewSheet } from "@/features/lender/application-review-sheet";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate } from "@/lib/format";
import type { LoanApplication } from "@/types";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Declined" },
];

function ApplicationsView() {
  const money = useMoney();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  const { data, isPending, error, refetch } = useApplications();

  const setReview = useCallback(
    (id: string | null) => router.replace(id ? `${pathname}?review=${id}` : pathname, { scroll: false }),
    [pathname, router],
  );

  const columns: Column<LoanApplication>[] = [
    {
      id: "applicant",
      header: "Applicant",
      hideOnMobile: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">{row.id}</p>
        </div>
      ),
    },
    { id: "product", header: "Product", cell: (row) => row.productName },
    { id: "amount", header: "Amount", className: "text-right tabular-nums", cell: (row) => money(row.amount) },
    { id: "tenor", header: "Tenor", cell: (row) => `${row.tenorMonths} mo` },
    { id: "submitted", header: "Submitted", cell: (row) => formatDate(row.submittedAt) },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const pendingCount = data?.filter((row) => row.status === "submitted" || row.status === "under_review").length ?? 0;

  return (
    <>
      <PageHeader title="Loan applications" description={data ? `${pendingCount} awaiting a decision · ${data.length} total` : "Review and decide on incoming applications"} />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          isLoading={isPending}
          columns={columns}
          getRowId={(row) => row.id}
          getSearchText={(row) => `${row.customerName} ${row.id} ${row.productName}`}
          searchPlaceholder="Search applicant or ID"
          filter={{ label: "Statuses", options: STATUS_OPTIONS, getValue: (row) => row.status }}
          onRowClick={(row) => setReview(row.id)}
          mobileTitle={(row) => row.customerName}
          empty={<EmptyState icon={FileText} title="No applications match" description="Try a different search or status filter." />}
        />
      )}
      <ApplicationReviewSheet applicationId={reviewId} onClose={() => setReview(null)} />
    </>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsView />
    </Suspense>
  );
}
