"use client";

import { StatusBadge } from "@/components/data/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMoney } from "@/features/tenants/tenant-context";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Installment } from "@/types";

export function ScheduleTable({ schedule }: { schedule: Installment[] }) {
  const money = useMoney();
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="w-10 px-3">#</TableHead>
              <TableHead className="px-3">Due date</TableHead>
              <TableHead className="px-3 text-right">Instalment</TableHead>
              <TableHead className="px-3 text-right">Principal</TableHead>
              <TableHead className="px-3 text-right">Interest</TableHead>
              <TableHead className="px-3 text-right">Balance</TableHead>
              <TableHead className="px-3">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((row) => (
              <TableRow key={row.index} className={cn(row.status === "overdue" && "bg-red-50/60")}>
                <TableCell className="px-3 text-muted-foreground">{row.index}</TableCell>
                <TableCell className="px-3">{formatDate(row.dueDate)}</TableCell>
                <TableCell className="px-3 text-right font-medium tabular-nums">{money(row.payment)}</TableCell>
                <TableCell className="px-3 text-right tabular-nums">{money(row.principal)}</TableCell>
                <TableCell className="px-3 text-right tabular-nums">{money(row.interest)}</TableCell>
                <TableCell className="px-3 text-right tabular-nums">{money(row.balance)}</TableCell>
                <TableCell className="px-3">
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ol className="divide-y rounded-lg border sm:hidden">
        {schedule.map((row) => (
          <li key={row.index} className={cn("flex items-center gap-3 px-3 py-2.5", row.status === "overdue" && "bg-red-50/60")}>
            <span className="w-5 text-xs text-muted-foreground">{row.index}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium tabular-nums">{money(row.payment)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(row.dueDate)}</p>
            </div>
            <StatusBadge status={row.status} />
          </li>
        ))}
      </ol>
    </>
  );
}
