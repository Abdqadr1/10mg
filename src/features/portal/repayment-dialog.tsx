"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { MoneyInput } from "@/components/forms/money-input";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { maxRepaymentAmount } from "@/lib/finance";
import { currencySymbol } from "@/lib/format";
import { REPAYMENT_METHODS, createRepaymentSchema, type RepaymentInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { Loan } from "@/types";
import { useMakeRepayment } from "./api";

const METHOD_META: Record<(typeof REPAYMENT_METHODS)[number], { label: string; icon: typeof CreditCard }> = {
  card: { label: "Debit card", icon: CreditCard },
  bank_transfer: { label: "Bank transfer", icon: Building2 },
  direct_debit: { label: "Direct debit", icon: RefreshCw },
};

interface RepaymentDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepaymentDialog({ loan, open, onOpenChange }: RepaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">{open && <RepaymentForm loan={loan} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function RepaymentForm({ loan, onDone }: { loan: Loan; onDone: () => void }) {
  const tenant = useTenant();
  const money = useMoney();
  const makeRepayment = useMakeRepayment(loan.id);
  const [formError, setFormError] = useState<string | null>(null);
  const maxAmount = maxRepaymentAmount(loan, tenant.settings.allowEarlyRepayment);
  const schema = useMemo(() => createRepaymentSchema(maxAmount), [maxAmount]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RepaymentInput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: Math.min(loan.amountDueNow, loan.outstanding), method: "card" },
  });

  const presets = [
    { label: "Amount due", value: Math.min(loan.amountDueNow, loan.outstanding) },
    ...(tenant.settings.allowEarlyRepayment && loan.outstanding > loan.amountDueNow ? [{ label: "Pay off in full", value: loan.outstanding }] : []),
  ];

  const onSubmit = handleSubmit((input) => {
    setFormError(null);
    makeRepayment.mutate(input, {
      onSuccess: (repayment) => {
        toast.success(`Payment of ${money(repayment.amount)} received`, { description: `Reference ${repayment.reference}` });
        onDone();
      },
      onError: (error) => setFormError(applyServerErrors(error, setError)),
    });
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>Make a repayment</DialogTitle>
        <DialogDescription>
          {loan.productName} · {money(loan.outstanding)} outstanding
        </DialogDescription>
      </DialogHeader>

      <FormError message={formError} />

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button key={preset.label} type="button" variant="secondary" size="sm" onClick={() => setValue("amount", preset.value, { shouldValidate: true })}>
            {preset.label} · {money(preset.value)}
          </Button>
        ))}
      </div>

      <FormField id="repayment-amount" label="Amount" error={errors.amount?.message}>
        <MoneyInput symbol={currencySymbol(tenant.settings.currency)} {...fieldA11y("repayment-amount", errors.amount?.message)} {...register("amount", { valueAsNumber: true })} />
      </FormField>

      {!tenant.settings.allowEarlyRepayment && (
        <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0" />
          {tenant.name} does not accept early repayments. You can pay up to the amount currently due.
        </p>
      )}

      <Controller
        control={control}
        name="method"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Payment method</legend>
            <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
              {REPAYMENT_METHODS.map((method) => {
                const meta = METHOD_META[method];
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={field.value === method}
                    onClick={() => field.onChange(method)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-(--radius) border p-3 text-xs transition-colors",
                      field.value === method ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
                    )}
                  >
                    <meta.icon className="size-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <DialogFooter>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={makeRepayment.isPending}>
          {makeRepayment.isPending ? "Processing…" : "Pay now"}
        </Button>
      </DialogFooter>
    </form>
  );
}
