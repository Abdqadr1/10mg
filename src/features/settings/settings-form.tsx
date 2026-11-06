"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ColorField } from "@/components/forms/color-field";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateTenant } from "@/features/tenants/api";
import { tenantSettingsSchema, type TenantSettingsInput } from "@/lib/schemas";
import { FONT_OPTIONS, brandingWarnings } from "@/lib/theme";
import type { Tenant } from "@/types";
import { BrandPreview } from "./brand-preview";
import { LogoUpload } from "./logo-upload";
import { ProductsEditor } from "./products-editor";

const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  { value: "KES", label: "Kenyan Shilling (KES)" },
  { value: "GHS", label: "Ghanaian Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
];

function toFormValues(tenant: Tenant): TenantSettingsInput {
  return {
    name: tenant.name,
    tagline: tenant.tagline,
    supportEmail: tenant.supportEmail,
    logoUrl: tenant.logoUrl,
    branding: { ...tenant.branding },
    settings: { ...tenant.settings },
    products: tenant.products.map((product) => ({ ...product, tenors: [...product.tenors] })),
  };
}

function SwitchRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(value) => onChange(value)} />
    </div>
  );
}

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const update = useUpdateTenant(tenant.slug);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<TenantSettingsInput>({ resolver: zodResolver(tenantSettingsSchema), defaultValues: toFormValues(tenant) });

  const draft = useWatch({ control }) as TenantSettingsInput;
  const warnings = brandingWarnings(draft.branding);

  const onSubmit = handleSubmit(
    (input) => {
      setFormError(null);
      update.mutate(input, {
        onSuccess: (saved) => {
          reset(toFormValues(saved));
          toast.success("Settings saved. Your portal has been updated.");
        },
        onError: (error) => setFormError(applyServerErrors(error, setError)),
      });
    },
    () => setFormError("Some fields need attention. Check each tab for errors."),
  );

  const tabError = {
    branding: Boolean(errors.name || errors.tagline || errors.supportEmail || errors.branding),
    products: Boolean(errors.products),
    policies: Boolean(errors.settings),
  };

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <FormError message={formError} />
        <Tabs defaultValue="branding">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="branding">Branding{tabError.branding && <span className="size-1.5 rounded-full bg-destructive" />}</TabsTrigger>
            <TabsTrigger value="products">Products{tabError.products && <span className="size-1.5 rounded-full bg-destructive" />}</TabsTrigger>
            <TabsTrigger value="policies">Policies{tabError.policies && <span className="size-1.5 rounded-full bg-destructive" />}</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>How your institution appears to customers across the portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Controller
                  control={control}
                  name="logoUrl"
                  render={({ field }) => <LogoUpload name={draft.name} branding={draft.branding} value={field.value} onChange={field.onChange} />}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="name" label="Institution name" error={errors.name?.message}>
                    <Input {...fieldA11y("name", errors.name?.message)} className="h-9" {...register("name")} />
                  </FormField>
                  <FormField id="supportEmail" label="Support email" error={errors.supportEmail?.message}>
                    <Input {...fieldA11y("supportEmail", errors.supportEmail?.message)} type="email" className="h-9" {...register("supportEmail")} />
                  </FormField>
                  <FormField id="tagline" label="Tagline" error={errors.tagline?.message} className="sm:col-span-2" hint="Shown on your landing and sign-in pages.">
                    <Input {...fieldA11y("tagline", errors.tagline?.message)} className="h-9" {...register("tagline")} />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Colours, typography and shape are applied to every screen instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="branding.primary"
                    render={({ field }) => (
                      <ColorField id="primary" label="Primary colour" value={field.value} onChange={field.onChange} error={errors.branding?.primary?.message} hint="Buttons, navigation and highlights" />
                    )}
                  />
                  <Controller
                    control={control}
                    name="branding.accent"
                    render={({ field }) => (
                      <ColorField id="accent" label="Accent colour" value={field.value} onChange={field.onChange} error={errors.branding?.accent?.message} hint="Badges, charts and promotional tags" />
                    )}
                  />
                  <FormField id="font" label="Typography">
                    <Controller
                      control={control}
                      name="branding.font"
                      render={({ field }) => (
                        <Select items={FONT_OPTIONS} value={field.value} onValueChange={(value) => field.onChange(value)}>
                          <SelectTrigger id="font" className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: `var(--font-${font.value})` }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <Controller
                    control={control}
                    name="branding.radius"
                    render={({ field }) => (
                      <FormField id="radius" label={`Corner radius · ${field.value}rem`}>
                        <input
                          id="radius"
                          type="range"
                          min={0}
                          max={1.5}
                          step={0.125}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          className="h-9 w-full accent-primary"
                        />
                      </FormField>
                    )}
                  />
                </div>
                {warnings.length > 0 && (
                  <ul className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {warnings.map((warning) => (
                      <li key={warning.message} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="pt-2">
            <ProductsEditor slug={tenant.slug} control={control} register={register} errors={errors} />
          </TabsContent>

          <TabsContent value="policies" className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Lending policies</CardTitle>
                <CardDescription>Rules enforced by the API and reflected in the customer portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="currency" label="Currency">
                    <Controller
                      control={control}
                      name="settings.currency"
                      render={({ field }) => (
                        <Select items={CURRENCIES} value={field.value} onValueChange={(value) => field.onChange(value)}>
                          <SelectTrigger id="currency" className="h-9 w-full">
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
                  <FormField id="maxActiveLoans" label="Max open loans per customer" error={errors.settings?.maxActiveLoans?.message}>
                    <Input {...fieldA11y("maxActiveLoans", errors.settings?.maxActiveLoans?.message)} type="number" min={1} max={5} className="h-9" {...register("settings.maxActiveLoans", { valueAsNumber: true })} />
                  </FormField>
                </div>
                <Controller
                  control={control}
                  name="settings.allowEarlyRepayment"
                  render={({ field }) => (
                    <SwitchRow
                      id="allowEarlyRepayment"
                      label="Allow early repayment"
                      description="Customers can pay more than the amount currently due, up to the full balance."
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="settings.requireBvn"
                  render={({ field }) => (
                    <SwitchRow
                      id="requireBvn"
                      label="Require BVN on applications"
                      description="Applicants must provide an 11-digit Bank Verification Number."
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          {isDirty && <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes</span>}
          <Button type="button" variant="ghost" disabled={!isDirty || update.isPending} onClick={() => reset(toFormValues(tenant))}>
            <Undo2 />
            Discard
          </Button>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save & publish"}
          </Button>
        </div>
      </div>

      <aside className="space-y-2 xl:sticky xl:top-20 xl:self-start">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Live preview</p>
        <BrandPreview name={draft.name} tagline={draft.tagline} logoUrl={draft.logoUrl} branding={draft.branding} currency={draft.settings.currency} />
        <p className="text-xs text-muted-foreground">Changes go live for every customer of {tenant.name} as soon as you save.</p>
      </aside>
    </form>
  );
}
