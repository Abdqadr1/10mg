"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { DataTable, type Column } from "@/components/data/data-table";
import { DescriptionList } from "@/components/data/description-list";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer, useCustomers } from "@/features/lender/api";
import { LoanProgress } from "@/features/loans/loan-progress";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate, initials, titleCase } from "@/lib/format";
import type { CustomerSummary } from "@/types";

function CustomerSheet({ customerId, onClose }: { customerId: string | null; onClose: () => void }) {
  const money = useMoney();
  const { data, isPending, error, refetch } = useCustomer(customerId);
  return (
    <Sheet open={Boolean(customerId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {isPending ? (
          <div className="space-y-4 p-6">
            <SheetTitle className="sr-only">Loading customer</SheetTitle>
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <>
            <SheetTitle className="sr-only">Customer unavailable</SheetTitle>
            <ErrorState error={error} onRetry={() => refetch()} />
          </>
        ) : (
          <div className="space-y-6 px-6 pb-6">
            <SheetHeader className="flex-row items-center gap-3 px-0 pt-6">
              <Avatar className="size-11">
                <AvatarFallback className="bg-accent text-accent-foreground">{initials(`${data.customer.firstName} ${data.customer.lastName}`)}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-lg">
                  {data.customer.firstName} {data.customer.lastName}
                </SheetTitle>
                <SheetDescription>Customer since {formatDate(data.customer.createdAt)}</SheetDescription>
              </div>
            </SheetHeader>
            <DescriptionList
              items={[
                { label: "Email", value: data.customer.email },
                { label: "Phone", value: data.customer.phone },
                { label: "Employment", value: titleCase(data.customer.employmentStatus) },
                { label: "Monthly income", value: money(data.customer.monthlyIncome) },
              ]}
            />
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Loans</h3>
              {data.loans.length ? (
                <ul className="divide-y rounded-lg border">
                  {data.loans.map((loan) => (
                    <li key={loan.id} className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {loan.productName} · {money(loan.principal)}
                        </p>
                        <StatusBadge status={loan.status} />
                      </div>
                      <LoanProgress loan={loan} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No loans yet.</p>
              )}
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Applications</h3>
              <ul className="divide-y rounded-lg border">
                {data.applications.map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      {application.productName} · {money(application.amount)}
                      <span className="block text-xs text-muted-foreground">{formatDate(application.submittedAt)}</span>
                    </span>
                    <StatusBadge status={application.status} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function CustomersPage() {
  const money = useMoney();
  const { data, isPending, error, refetch } = useCustomers();
  const [selected, setSelected] = useState<string | null>(null);

  const columns: Column<CustomerSummary>[] = [
    {
      id: "name",
      header: "Customer",
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-xs text-accent-foreground">{initials(`${row.firstName} ${row.lastName}`)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.firstName} {row.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { id: "phone", header: "Phone", cell: (row) => row.phone },
    { id: "loans", header: "Open loans", cell: (row) => row.activeLoans },
    { id: "borrowed", header: "Total borrowed", className: "text-right tabular-nums", cell: (row) => money(row.totalBorrowed) },
    { id: "outstanding", header: "Outstanding", className: "text-right tabular-nums", cell: (row) => money(row.outstanding) },
    { id: "since", header: "Joined", cell: (row) => formatDate(row.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Customers" description={data ? `${data.length} registered borrowers` : "Everyone who has an account with you"} />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          isLoading={isPending}
          columns={columns}
          getRowId={(row) => row.id}
          getSearchText={(row) => `${row.firstName} ${row.lastName} ${row.email} ${row.phone}`}
          searchPlaceholder="Search name, email or phone"
          filter={{
            label: "Customers",
            options: [
              { value: "borrowing", label: "With open loans" },
              { value: "clear", label: "No open loans" },
            ],
            getValue: (row) => (row.activeLoans > 0 ? "borrowing" : "clear"),
          }}
          onRowClick={(row) => setSelected(row.id)}
          mobileTitle={(row) => `${row.firstName} ${row.lastName}`}
          empty={<EmptyState icon={Users} title="No customers found" />}
        />
      )}
      <CustomerSheet customerId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
