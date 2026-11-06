import { Check, Circle, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Loan, LoanApplication } from "@/types";

type StepState = "complete" | "current" | "pending" | "failed";

interface Step {
  label: string;
  date: string | null;
  state: StepState;
}

export function buildLifecycle(application: Pick<LoanApplication, "status" | "submittedAt" | "reviewedAt" | "decidedAt">, loan?: Pick<Loan, "status" | "disbursedAt"> | null): Step[] {
  const rejected = application.status === "rejected";
  const approved = application.status === "approved";
  const repaid = loan?.status === "repaid";
  return [
    { label: "Submitted", date: application.submittedAt, state: "complete" },
    {
      label: "Under review",
      date: application.reviewedAt,
      state: application.status === "submitted" ? "current" : "complete",
    },
    {
      label: rejected ? "Declined" : "Approved",
      date: application.decidedAt,
      state: rejected ? "failed" : approved ? "complete" : application.status === "under_review" ? "current" : "pending",
    },
    {
      label: "Disbursed",
      date: loan?.disbursedAt ?? null,
      state: loan ? "complete" : "pending",
    },
    {
      label: "Repaid",
      date: null,
      state: repaid ? "complete" : loan ? "current" : "pending",
    },
  ].filter((step, index) => !(rejected && index > 2)) as Step[];
}

const ICONS: Record<StepState, typeof Check> = { complete: Check, current: Circle, pending: Circle, failed: X };

interface StatusTimelineProps {
  application: LoanApplication;
  loan?: Loan | null;
  orientation?: "responsive" | "vertical";
  className?: string;
}

export function StatusTimeline({ application, loan, orientation = "responsive", className }: StatusTimelineProps) {
  const steps = buildLifecycle(application, loan);
  const horizontal = orientation === "responsive";
  return (
    <ol aria-label="Application progress" className={cn("flex flex-col gap-4", horizontal && "sm:flex-row sm:gap-0", className)}>
      {steps.map((step, index) => {
        const Icon = ICONS[step.state];
        return (
          <li
            key={step.label}
            className={cn("relative flex flex-1 items-center gap-3", horizontal && "sm:flex-col sm:items-start sm:gap-2")}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <div className={cn("flex items-center", horizontal && "sm:w-full")}>
              <span
                className={cn(
                  "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                  step.state === "complete" && "border-primary bg-primary text-primary-foreground",
                  step.state === "current" && "border-primary bg-background text-primary",
                  step.state === "pending" && "border-border bg-background text-muted-foreground",
                  step.state === "failed" && "border-red-600 bg-red-600 text-white",
                )}
              >
                <Icon className={cn("size-3.5", (step.state === "current" || step.state === "pending") && "size-2 fill-current")} />
              </span>
              {horizontal && index < steps.length - 1 && (
                <span className={cn("hidden h-0.5 flex-1 sm:block", step.state === "complete" ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <div className={cn("min-w-0", horizontal && "sm:pr-3")}>
              <p className={cn("text-sm font-medium", step.state === "pending" && "text-muted-foreground")}>{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.date ? formatDate(step.date) : step.state === "current" ? "In progress" : "—"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
