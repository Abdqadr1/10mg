"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLenderLoan, useLoans } from "@/features/lender/api";
import { LoanProgress } from "@/features/loans/loan-progress";
import { LoanSummary } from "@/features/loans/loan-summary";
import { RepaymentHistory } from "@/features/loans/repayment-history";
import { ScheduleTable } from "@/features/loans/schedule-table";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate } from "@/lib/format";
import type { Loan } from "@/types";

function LoanSheet({ loanId, onClose }: { loanId: string | null; onClose: () => void }) {
  const { data, isPending, error, refetch } = useLenderLoan(loanId);
  return (
    <Sheet open={Boolean(loanId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {isPending ? (
          <div className="space-y-4 p-6">
            <SheetTitle className="sr-only">Loading loan</SheetTitle>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <>
            <SheetTitle className="sr-only">Loan unavailable</SheetTitle>
            <ErrorState error={error} onRetry={() => refetch()} />
          </>
        ) : (
          <div className="space-y-6 px-6 pb-6">
            <SheetHeader className="px-0 pt-6">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{data.customerName}</SheetTitle>
                <StatusBadge status={data.status} />
              </div>
              <SheetDescription>
                {data.productName} · {data.id}
              </SheetDescription>
            </SheetHeader>
            <LoanSummary loan={data} />
            <Tabs defaultValue="schedule">
              <TabsList>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="repayments">Repayments ({data.repayments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="schedule" className="pt-3">
                <ScheduleTable schedule={data.schedule} />
              </TabsContent>
              <TabsContent value="repayments" className="pt-3">
                <RepaymentHistory repayments={data.repayments} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function LoansPage() {
  const money = useMoney();
  const { data, isPending, error, refetch } = useLoans();
  const [selected, setSelected] = useState<string | null>(null);

  const columns: Column<Loan>[] = [
    {
      id: "borrower",
      header: "Borrower",
      hideOnMobile: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">{row.productName}</p>
        </div>
      ),
    },
    { id: "principal", header: "Principal", className: "text-right tabular-nums", cell: (row) => money(row.principal) },
    { id: "outstanding", header: "Outstanding", className: "text-right tabular-nums", cell: (row) => money(row.outstanding) },
    { id: "progress", header: "Repaid", className: "w-36", cell: (row) => <LoanProgress loan={row} /> },
    { id: "next", header: "Next due", cell: (row) => (row.nextDueDate ? formatDate(row.nextDueDate) : "—") },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const totals = data?.reduce((acc, loan) => ({ outstanding: acc.outstanding + loan.outstanding, overdue: acc.overdue + (loan.status === "overdue" ? 1 : 0) }), { outstanding: 0, overdue: 0 });

  return (
    <>
      <PageHeader
        title="Loan book"
        description={totals ? `${money(totals.outstanding)} outstanding across ${data?.length} loans · ${totals.overdue} overdue` : "All disbursed loans"}
      />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          isLoading={isPending}
          columns={columns}
          getRowId={(row) => row.id}
          getSearchText={(row) => `${row.customerName} ${row.id} ${row.productName}`}
          searchPlaceholder="Search borrower or loan ID"
          filter={{
            label: "Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "overdue", label: "Overdue" },
              { value: "repaid", label: "Repaid" },
            ],
            getValue: (row) => row.status,
          }}
          onRowClick={(row) => setSelected(row.id)}
          mobileTitle={(row) => `${row.customerName} · ${row.productName}`}
          empty={<EmptyState icon={HandCoins} title="No loans found" description="Approved applications become loans here." />}
        />
      )}
      <LoanSheet loanId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
