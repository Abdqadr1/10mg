import { cn } from "@/lib/utils";
import type { Loan } from "@/types";

export function LoanProgress({ loan, className, showLabel = true }: { loan: Pick<Loan, "amountPaid" | "totalRepayable">; className?: string; showLabel?: boolean }) {
  const percent = loan.totalRepayable > 0 ? Math.min(100, Math.round((loan.amountPaid / loan.totalRepayable) * 100)) : 0;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Repayment progress">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      {showLabel && <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{percent}%</span>}
    </div>
  );
}
