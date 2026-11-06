"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { ColorField } from "@/components/forms/color-field";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { PasswordInput } from "@/components/forms/password-input";
import { PlatformHeader } from "@/components/layout/platform-header";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOnboardTenant } from "@/features/tenants/api";
import { onboardTenantSchema, type OnboardTenantInput } from "@/lib/schemas";
import { themeStyle } from "@/lib/theme";
import type { Tenant } from "@/types";

const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  { value: "KES", label: "Kenyan Shilling (KES)" },
  { value: "GHS", label: "Ghanaian Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function OnboardPage() {
  const onboard = useOnboardTenant();
  const [created, setCreated] = useState<{ tenant: Tenant; email: string; password: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<OnboardTenantInput>({
    resolver: zodResolver(onboardTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      primary: "#c2410c",
      accent: "#facc15",
      currency: "NGN",
      supportEmail: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });
  const preview = useWatch({ control });

  const onSubmit = handleSubmit((input) => {
    setFormError(null);
    onboard.mutate(input, {
      onSuccess: (tenant) => {
        setCreated({ tenant, email: input.adminEmail, password: input.adminPassword });
        toast.success(`${tenant.name} is live`);
        reset();
        setSlugTouched(false);
      },
      onError: (error) => setFormError(applyServerErrors(error, setError)),
    });
  });

  const previewTenant = {
    name: preview.name || "Your institution",
    logoUrl: null,
    branding: { primary: preview.primary ?? "#000000", accent: preview.accent ?? "#000000", radius: 0.5, font: "geist" as const },
  };

  return (
    <div className="min-h-dvh bg-neutral-50">
      <PlatformHeader active="onboard" />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Onboard a new institution</h1>
            <p className="text-sm text-muted-foreground">
              Provision a lender on 10MG Credit. It gets its own URL, branding, admin account and isolated data. No deploy required.
            </p>
          </div>

          {created && (
            <Card className="border-emerald-200 bg-emerald-50 ring-emerald-200">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 font-medium text-emerald-900">
                  <CheckCircle2 className="size-5" />
                  {created.tenant.name} is ready at /{created.tenant.slug}
                </div>
                <p className="text-sm text-emerald-900/80">
                  Sign in to the lender console with <span className="font-mono">{created.email}</span> and the password you chose to configure products and branding.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${created.tenant.slug}/login?as=staff`} className={buttonVariants({ size: "lg" })}>
                    Open lender console
                  </Link>
                  <Link href={`/${created.tenant.slug}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
                    View customer portal
                  </Link>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/${created.tenant.slug}`).then(() => toast.success("Link copied"))}
                  >
                    <Copy />
                    Copy link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <form noValidate onSubmit={onSubmit}>
              <CardHeader>
                <CardTitle>Institution</CardTitle>
                <CardDescription>Public details and brand basics. Everything can be refined later in the lender console.</CardDescription>
              </CardHeader>
              <CardContent className="mt-4 space-y-5">
                <FormError message={formError} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="name" label="Institution name" error={errors.name?.message}>
                    <Input
                      {...fieldA11y("name", errors.name?.message)}
                      className="h-10"
                      placeholder="e.g. Sunrise Microfinance"
                      {...register("name", {
                        onChange: (event) => {
                          if (!slugTouched) setValue("slug", slugify(event.target.value), { shouldValidate: Boolean(errors.slug) });
                        },
                      })}
                    />
                  </FormField>
                  <FormField id="slug" label="Portal URL" error={errors.slug?.message} hint="Lowercase letters, numbers and dashes">
                    <div className="flex h-10 items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                      <span className="pl-2.5 text-sm text-muted-foreground">10mg.app/</span>
                      <input
                        {...fieldA11y("slug", errors.slug?.message)}
                        className="h-full min-w-0 flex-1 bg-transparent pr-2.5 text-sm outline-none"
                        {...register("slug", { onChange: () => setSlugTouched(true) })}
                      />
                    </div>
                  </FormField>
                  <Controller
                    control={control}
                    name="primary"
                    render={({ field }) => <ColorField id="primary" label="Primary colour" value={field.value} onChange={field.onChange} error={errors.primary?.message} />}
                  />
                  <Controller
                    control={control}
                    name="accent"
                    render={({ field }) => <ColorField id="accent" label="Accent colour" value={field.value} onChange={field.onChange} error={errors.accent?.message} />}
                  />
                  <FormField id="currency" label="Currency" error={errors.currency?.message}>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select items={CURRENCIES} value={field.value} onValueChange={(value) => field.onChange(value)}>
                          <SelectTrigger id="currency" className="h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField id="supportEmail" label="Customer support email" error={errors.supportEmail?.message}>
                    <Input {...fieldA11y("supportEmail", errors.supportEmail?.message)} type="email" className="h-10" {...register("supportEmail")} />
                  </FormField>
                </div>

                <Separator />
                <div className="space-y-1">
                  <h2 className="font-medium">First administrator</h2>
                  <p className="text-sm text-muted-foreground">This person can sign in to the lender console and invite the rest of the team.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField id="adminName" label="Full name" error={errors.adminName?.message}>
                    <Input {...fieldA11y("adminName", errors.adminName?.message)} className="h-10" {...register("adminName")} />
                  </FormField>
                  <FormField id="adminEmail" label="Email" error={errors.adminEmail?.message}>
                    <Input {...fieldA11y("adminEmail", errors.adminEmail?.message)} type="email" className="h-10" {...register("adminEmail")} />
                  </FormField>
                  <FormField id="adminPassword" label="Password" error={errors.adminPassword?.message}>
                    <PasswordInput {...fieldA11y("adminPassword", errors.adminPassword?.message)} autoComplete="new-password" className="h-10" {...register("adminPassword")} />
                  </FormField>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={onboard.isPending}>
                    {onboard.isPending ? "Provisioning…" : "Create institution"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Live preview</p>
          <div style={themeStyle(previewTenant.branding)} className="overflow-hidden rounded-xl border bg-card font-sans shadow-sm">
            <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
              <TenantLogo tenant={previewTenant} size="sm" />
              <span className="truncate text-sm font-semibold">{previewTenant.name}</span>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium">Get up to {preview.currency ?? "NGN"} 500k in minutes</p>
              <div className="h-2 overflow-hidden rounded-full bg-accent">
                <div className="h-full w-2/3 rounded-full bg-primary" />
              </div>
              <div className="flex gap-2">
                <span className={buttonVariants({ size: "sm" })}>Apply now</span>
                <span className="inline-flex h-7 items-center rounded-full bg-brand-accent px-2.5 text-xs font-medium text-brand-accent-foreground">New</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
