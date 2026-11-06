import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, InstallmentStatus, LoanStatus } from "@/types";

type Status = ApplicationStatus | LoanStatus | InstallmentStatus;

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-sky-100 text-sky-800" },
  under_review: { label: "Under review", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
  repaid: { label: "Repaid", className: "bg-slate-100 text-slate-700" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800" },
  partial: { label: "Part-paid", className: "bg-amber-100 text-amber-800" },
  due: { label: "Due next", className: "bg-sky-100 text-sky-800" },
  upcoming: { label: "Upcoming", className: "bg-slate-100 text-slate-600" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STATUS_STYLES[status];
  return <Badge className={cn("border-transparent", style.className, className)}>{style.label}</Badge>;
}
