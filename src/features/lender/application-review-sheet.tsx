"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DescriptionList } from "@/components/data/description-list";
import { StatusBadge } from "@/components/data/status-badge";
import { StatusTimeline } from "@/components/data/status-timeline";
import { ErrorState } from "@/components/feedback/error-state";
import { FormError } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/features/tenants/tenant-context";
import { isApiError } from "@/lib/api/client";
import { formatDate, formatMonths, formatPercent, titleCase } from "@/lib/format";
import { decisionSchema, type DecisionInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useApplicationReview, useDecideApplication } from "./api";

function affordability(dti: number) {
  if (dti <= 0.35) return { label: "Comfortable", tone: "bg-emerald-500", text: "text-emerald-700", advice: "Repayments are well within the applicant's means." };
  if (dti <= 0.5) return { label: "Stretched", tone: "bg-amber-500", text: "text-amber-700", advice: "Consider a longer tenor or smaller amount." };
  return { label: "High risk", tone: "bg-red-500", text: "text-red-700", advice: "Debt service exceeds 50% of declared income." };
}

export function ApplicationReviewSheet({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Sheet open={Boolean(applicationId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {applicationId && <ReviewBody key={applicationId} applicationId={applicationId} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function ReviewBody({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const money = useMoney();
  const { data, isPending, error, refetch } = useApplicationReview(applicationId);
  const decide = useDecideApplication();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="space-y-4 p-6">
        <SheetTitle className="sr-only">Loading application</SheetTitle>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <>
        <SheetTitle className="sr-only">Application unavailable</SheetTitle>
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }

  const { application, customer, estimate, debtToIncome, existingLoans, previousApplications } = data;
  const risk = affordability(debtToIncome);
  const pending = application.status === "submitted" || application.status === "under_review";
  const overdueHistory = existingLoans.filter((loan) => loan.status === "overdue").length;

  const submit = (action: DecisionInput["action"]) => {
    setFormError(null);
    const parsed = decisionSchema.safeParse({ action, note });
    if (!parsed.success) {
      setNoteError(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setNoteError(null);
    decide.mutate(
      { id: application.id, ...parsed.data },
      {
        onSuccess: (updated) => {
          const messages = { under_review: "Application moved to review", approved: "Loan approved and disbursed", rejected: "Application declined" } as const;
          toast.success(messages[updated.status as keyof typeof messages] ?? "Application updated");
          if (updated.status !== "under_review") onClose();
        },
        onError: (mutationError) => setFormError(isApiError(mutationError) ? mutationError.message : "Could not update the application"),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <SheetHeader className="px-0 pt-6">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-lg">{application.customerName}</SheetTitle>
          <StatusBadge status={application.status} />
        </div>
        <SheetDescription>
          {application.productName} · {application.id} · submitted {formatDate(application.submittedAt)}
        </SheetDescription>
      </SheetHeader>

      <StatusTimeline application={application} orientation="vertical" />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Loan request</h3>
        <DescriptionList
          items={[
            { label: "Amount requested", value: money(application.amount) },
            { label: "Tenor", value: `${formatMonths(application.tenorMonths)} @ ${application.interestRate}% p.a.` },
            { label: "Monthly instalment", value: money(estimate.monthlyPayment) },
            { label: "Total repayable", value: money(estimate.totalRepayable) },
          ]}
        />
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-xs text-muted-foreground">Purpose</p>
          <p>{application.purpose}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Affordability</h3>
          <span className={cn("text-sm font-medium", risk.text)}>{risk.label}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Debt-to-income {formatPercent(debtToIncome)}</span>
            <span>Income {money(application.monthlyIncome)}/mo</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(debtToIncome * 100)} aria-label="Debt to income ratio">
            <div className={cn("h-full rounded-full", risk.tone)} style={{ width: `${Math.min(debtToIncome, 1) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{risk.advice}</p>
        </div>
        <DescriptionList
          items={[
            { label: "Existing loans", value: `${existingLoans.length} (${existingLoans.filter((loan) => loan.status !== "repaid").length} open)` },
            { label: "Overdue history", value: overdueHistory ? <span className="text-red-700">{overdueHistory} overdue</span> : "None" },
            { label: "Previous applications", value: previousApplications.length },
            { label: "Declined before", value: previousApplications.filter((app) => app.status === "rejected").length },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Applicant</h3>
        <DescriptionList
          items={[
            { label: "Email", value: customer.email },
            { label: "Phone", value: customer.phone },
            { label: "Employment", value: titleCase(customer.employmentStatus) },
            { label: "Employer", value: customer.employer || "—" },
            { label: "Customer since", value: formatDate(customer.createdAt) },
          ]}
        />
      </section>

      <Separator />

      {pending ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Decision</h3>
          <FormError message={formError} />
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">Note to applicant</Label>
            <Textarea
              id="decision-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Required when declining. Optional for approvals."
              aria-invalid={noteError ? true : undefined}
              aria-describedby={noteError ? "decision-note-error" : undefined}
              rows={3}
            />
            {noteError && (
              <p id="decision-note-error" role="alert" className="text-xs font-medium text-destructive">
                {noteError}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="h-10 w-full" disabled={decide.isPending} onClick={() => submit("approve")}>
              Approve & disburse {money(application.amount, { compact: true })}
            </Button>
            {application.status === "submitted" && (
              <Button variant="outline" size="lg" className="h-10 min-w-32 flex-1" disabled={decide.isPending} onClick={() => submit("start_review")}>
                Start review
              </Button>
            )}
            <Button variant="destructive" size="lg" className="h-10 min-w-32 flex-1" disabled={decide.isPending} onClick={() => submit("reject")}>
              Decline
            </Button>
          </div>
        </section>
      ) : (
        <section className="space-y-1 rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">
            {application.status === "approved" ? "Approved" : "Declined"} on {formatDate(application.decidedAt)}
          </p>
          {application.decisionNote && <p className="text-muted-foreground">“{application.decisionNote}”</p>}
        </section>
      )}
    </div>
  );
}
