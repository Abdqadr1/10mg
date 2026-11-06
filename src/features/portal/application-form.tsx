"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DescriptionList } from "@/components/data/description-list";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { MoneyInput } from "@/components/forms/money-input";
import { Stepper } from "@/components/forms/stepper";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { isApiError } from "@/lib/api/client";
import { estimateRepayment } from "@/lib/finance";
import { currencySymbol, formatMonths, titleCase } from "@/lib/format";
import { EMPLOYMENT_STATUSES, createApplicationSchema, type ApplicationInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { Customer, LoanApplication } from "@/types";
import { useCreateApplication } from "./api";

const STEPS = ["Loan details", "About you", "Review & submit"];
const STEP_FIELDS: FieldPath<ApplicationInput>[][] = [
  ["productId", "amount", "tenorMonths"],
  ["employmentStatus", "employer", "monthlyIncome", "bvn", "purpose"],
  ["consent"],
];
const EMPLOYMENT_ITEMS = EMPLOYMENT_STATUSES.map((value) => ({ value, label: titleCase(value) }));

interface ApplicationFormProps {
  customer: Customer;
  initial: { productId?: string | null; amount?: number | null; tenor?: number | null };
  onSubmitted: (application: LoanApplication) => void;
}

export function ApplicationForm({ customer, initial, onSubmitted }: ApplicationFormProps) {
  const tenant = useTenant();
  const money = useMoney();
  const createApplication = useCreateApplication();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createApplicationSchema(tenant), [tenant]);

  const initialProduct = tenant.products.find((product) => product.id === initial.productId) ?? tenant.products[0];
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      productId: initialProduct.id,
      amount: initial.amount ?? initialProduct.minAmount,
      tenorMonths: initial.tenor && initialProduct.tenors.includes(initial.tenor) ? initial.tenor : initialProduct.tenors[0],
      purpose: "",
      employmentStatus: customer.employmentStatus,
      employer: customer.employer,
      monthlyIncome: customer.monthlyIncome || (undefined as unknown as number),
      bvn: "",
      consent: false,
    },
  });

  const values = useWatch({ control });
  const product = tenant.products.find((item) => item.id === values.productId) ?? initialProduct;
  const validAmount = Number.isFinite(values.amount) && (values.amount ?? 0) > 0 ? (values.amount as number) : 0;
  const estimate = estimateRepayment(validAmount, product.interestRate, values.tenorMonths ?? product.tenors[0]);
  const affordabilityRatio = values.monthlyIncome ? estimate.monthlyPayment / values.monthlyIncome : null;

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const onSubmit = handleSubmit(
    (input) => {
      setFormError(null);
      createApplication.mutate(input, {
        onSuccess: onSubmitted,
        onError: (error) => {
          setFormError(applyServerErrors(error, setError));
          const serverFields = isApiError(error) ? Object.keys(error.fieldErrors) : [];
          const firstInvalidStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => serverFields.includes(field)));
          if (firstInvalidStep >= 0) setStep(firstInvalidStep);
        },
      });
    },
    (fieldErrors) => {
      const firstInvalidStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => field in fieldErrors));
      if (firstInvalidStep >= 0) setStep(firstInvalidStep);
    },
  );

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <Stepper steps={STEPS} current={step} />
        <FormError message={formError} />

        <Card>
          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Choose a product</legend>
                  <Controller
                    control={control}
                    name="productId"
                    render={({ field }) => (
                      <div role="radiogroup" aria-label="Loan product" className="grid gap-3 sm:grid-cols-2">
                        {tenant.products.map((item) => {
                          const selected = field.value === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => {
                                field.onChange(item.id);
                                if (!item.tenors.includes(getValues("tenorMonths"))) setValue("tenorMonths", item.tenors[0]);
                              }}
                              className={cn("rounded-(--radius) border p-4 text-left transition-colors", selected ? "border-primary bg-accent ring-1 ring-primary" : "hover:bg-muted")}
                            >
                              <span className="flex items-center justify-between font-medium">
                                {item.name}
                                <span className="text-xs font-normal text-muted-foreground">{item.interestRate}% p.a.</span>
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
                              <span className="mt-2 block text-xs">
                                {money(item.minAmount, { compact: true })} – {money(item.maxAmount, { compact: true })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </fieldset>

                <FormField id="amount" label="Amount" error={errors.amount?.message} hint={`Between ${money(product.minAmount)} and ${money(product.maxAmount)}`}>
                  <MoneyInput symbol={currencySymbol(tenant.settings.currency)} {...fieldA11y("amount", errors.amount?.message)} {...register("amount", { valueAsNumber: true })} />
                </FormField>

                <Controller
                  control={control}
                  name="tenorMonths"
                  render={({ field }) => (
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">Repayment period</legend>
                      <div role="radiogroup" aria-label="Repayment period" className="flex flex-wrap gap-2">
                        {product.tenors.map((months) => (
                          <button
                            key={months}
                            type="button"
                            role="radio"
                            aria-checked={field.value === months}
                            onClick={() => field.onChange(months)}
                            className={cn(
                              "rounded-full border px-4 py-1.5 text-sm transition-colors",
                              field.value === months ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                            )}
                          >
                            {months} {months === 1 ? "month" : "months"}
                          </button>
                        ))}
                      </div>
                      {errors.tenorMonths?.message && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {errors.tenorMonths.message}
                        </p>
                      )}
                    </fieldset>
                  )}
                />
              </>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="employmentStatus" label="Employment status" error={errors.employmentStatus?.message}>
                  <Controller
                    control={control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <Select items={EMPLOYMENT_ITEMS} value={field.value} onValueChange={(value) => field.onChange(value)}>
                        <SelectTrigger id="employmentStatus" className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField id="employer" label="Employer / business name" error={errors.employer?.message}>
                  <Input {...fieldA11y("employer", errors.employer?.message)} className="h-10" {...register("employer")} />
                </FormField>
                <FormField id="monthlyIncome" label="Monthly net income" error={errors.monthlyIncome?.message}>
                  <MoneyInput symbol={currencySymbol(tenant.settings.currency)} {...fieldA11y("monthlyIncome", errors.monthlyIncome?.message)} {...register("monthlyIncome", { valueAsNumber: true })} />
                </FormField>
                {tenant.settings.requireBvn && (
                  <FormField id="bvn" label="Bank Verification Number (BVN)" error={errors.bvn?.message} hint="11 digits. Used only to verify your identity.">
                    <Input {...fieldA11y("bvn", errors.bvn?.message)} inputMode="numeric" maxLength={11} className="h-10 font-mono" {...register("bvn")} />
                  </FormField>
                )}
                <FormField id="purpose" label="What is the loan for?" error={errors.purpose?.message} className="sm:col-span-2">
                  <Textarea {...fieldA11y("purpose", errors.purpose?.message)} rows={3} maxLength={300} {...register("purpose")} />
                </FormField>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <DescriptionList
                  items={[
                    { label: "Product", value: product.name },
                    { label: "Amount", value: money(validAmount) },
                    { label: "Repayment period", value: formatMonths(values.tenorMonths ?? 0) },
                    { label: "Interest rate", value: `${product.interestRate}% p.a.` },
                    { label: "Employment", value: titleCase(values.employmentStatus ?? "") },
                    { label: "Monthly income", value: money(values.monthlyIncome || 0) },
                    ...(tenant.settings.requireBvn ? [{ label: "BVN", value: `•••••••${(values.bvn ?? "").slice(-4)}` }] : []),
                    { label: "Purpose", value: values.purpose },
                  ]}
                />
                <div className="space-y-1.5">
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-0.5 size-4 accent-primary" aria-invalid={errors.consent ? true : undefined} {...register("consent")} />
                    <span>
                      I confirm the information above is accurate and I authorise {tenant.name} to run credit and identity checks. I have read the loan terms and the repayment
                      schedule.
                    </span>
                  </label>
                  {errors.consent?.message && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.consent.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={step === 0} className={cn(step === 0 && "invisible")}>
            <ArrowLeft />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button key="next" type="button" size="lg" onClick={next}>
              Continue
              <ArrowRight />
            </Button>
          ) : (
            <Button key="submit" type="submit" size="lg" disabled={createApplication.isPending}>
              {createApplication.isPending ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="bg-accent ring-0">
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-accent-foreground">Your estimate</p>
            <div>
              <p className="text-xs text-muted-foreground">Monthly repayment</p>
              <p className="text-3xl font-semibold tracking-tight text-accent-foreground tabular-nums">{money(estimate.monthlyPayment)}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Borrowing</dt>
                <dd className="tabular-nums">{money(validAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total interest</dt>
                <dd className="tabular-nums">{money(estimate.totalInterest)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Total repayable</dt>
                <dd className="tabular-nums">{money(estimate.totalRepayable)}</dd>
              </div>
            </dl>
            {affordabilityRatio !== null && Number.isFinite(affordabilityRatio) && (
              <p className={cn("rounded-md px-3 py-2 text-xs", affordabilityRatio > 0.5 ? "bg-red-100 text-red-800" : affordabilityRatio > 0.35 ? "bg-amber-100 text-amber-800" : "bg-background text-muted-foreground")}>
                Repayments would use {Math.round(affordabilityRatio * 100)}% of your monthly income.
                {affordabilityRatio > 0.5 && " Consider a smaller amount or longer period."}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">Estimate only. Final terms are confirmed on approval.</p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
