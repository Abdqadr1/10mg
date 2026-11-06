"use client";

import { Receipt } from "lucide-react";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useRepayments } from "@/features/lender/api";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate, titleCase } from "@/lib/format";
import type { Repayment } from "@/types";

export default function RepaymentsPage() {
  const money = useMoney();
  const { data, isPending, error, refetch } = useRepayments();

  const columns: Column<Repayment>[] = [
    { id: "date", header: "Date", cell: (row) => formatDate(row.paidAt) },
    { id: "customer", header: "Customer", hideOnMobile: true, cell: (row) => <span className="font-medium">{row.customerName}</span> },
    { id: "loan", header: "Loan", cell: (row) => <span className="font-mono text-xs">{row.loanId}</span> },
    { id: "method", header: "Method", cell: (row) => titleCase(row.method) },
    { id: "reference", header: "Reference", cell: (row) => <span className="font-mono text-xs">{row.reference}</span> },
    { id: "amount", header: "Amount", className: "text-right tabular-nums font-medium text-emerald-700", cell: (row) => money(row.amount) },
  ];

  const total = data?.reduce((sum, repayment) => sum + repayment.amount, 0) ?? 0;

  return (
    <>
      <PageHeader title="Repayment activity" description={data ? `${data.length} payments · ${money(total)} collected` : "Every payment received"} />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          isLoading={isPending}
          columns={columns}
          pageSize={15}
          getRowId={(row) => row.id}
          getSearchText={(row) => `${row.customerName} ${row.reference} ${row.loanId}`}
          searchPlaceholder="Search customer, reference or loan"
          filter={{
            label: "Methods",
            options: [
              { value: "bank_transfer", label: "Bank transfer" },
              { value: "card", label: "Card" },
              { value: "direct_debit", label: "Direct debit" },
            ],
            getValue: (row) => row.method,
          }}
          mobileTitle={(row) => row.customerName}
          empty={<EmptyState icon={Receipt} title="No repayments found" />}
        />
      )}
    </>
  );
}
