"use client";

import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FormField, fieldA11y } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TENOR_OPTIONS, type TenantSettingsInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface ProductsEditorProps {
  slug: string;
  control: Control<TenantSettingsInput>;
  register: UseFormRegister<TenantSettingsInput>;
  errors: FieldErrors<TenantSettingsInput>;
}

export function ProductsEditor({ slug, control, register, errors }: ProductsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "products", keyName: "fieldKey" });

  return (
    <div className="space-y-4">
      {errors.products?.root?.message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errors.products.root.message}
        </p>
      )}
      {fields.map((field, index) => {
        const productErrors = errors.products?.[index];
        const prefix = `products.${index}` as const;
        const fieldId = (name: string) => `product-${index}-${name}`;
        return (
          <Card key={field.fieldKey} size="sm">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Product {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={fields.length === 1} aria-label={`Remove product ${index + 1}`}>
                  <Trash2 />
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={fieldId("name")} label="Name" error={productErrors?.name?.message}>
                  <Input {...fieldA11y(fieldId("name"), productErrors?.name?.message)} className="h-9" {...register(`${prefix}.name`)} />
                </FormField>
                <FormField id={fieldId("rate")} label="Interest rate (% p.a.)" error={productErrors?.interestRate?.message}>
                  <Input {...fieldA11y(fieldId("rate"), productErrors?.interestRate?.message)} type="number" step="0.1" className="h-9" {...register(`${prefix}.interestRate`, { valueAsNumber: true })} />
                </FormField>
                <FormField id={fieldId("description")} label="Description" error={productErrors?.description?.message} className="sm:col-span-2">
                  <Input {...fieldA11y(fieldId("description"), productErrors?.description?.message)} className="h-9" {...register(`${prefix}.description`)} />
                </FormField>
                <FormField id={fieldId("min")} label="Minimum amount" error={productErrors?.minAmount?.message}>
                  <Input {...fieldA11y(fieldId("min"), productErrors?.minAmount?.message)} type="number" className="h-9" {...register(`${prefix}.minAmount`, { valueAsNumber: true })} />
                </FormField>
                <FormField id={fieldId("max")} label="Maximum amount" error={productErrors?.maxAmount?.message}>
                  <Input {...fieldA11y(fieldId("max"), productErrors?.maxAmount?.message)} type="number" className="h-9" {...register(`${prefix}.maxAmount`, { valueAsNumber: true })} />
                </FormField>
              </div>
              <Controller
                control={control}
                name={`${prefix}.tenors`}
                render={({ field: tenorField }) => (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Available tenors (months)</legend>
                    <div className="flex flex-wrap gap-2">
                      {TENOR_OPTIONS.map((months) => {
                        const checked = tenorField.value.includes(months);
                        return (
                          <button
                            key={months}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() =>
                              tenorField.onChange(
                                checked ? tenorField.value.filter((value) => value !== months) : [...tenorField.value, months].sort((a, b) => a - b),
                              )
                            }
                            className={cn(
                              "min-w-10 rounded-full border px-3 py-1 text-sm transition-colors",
                              checked ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                            )}
                          >
                            {months}
                          </button>
                        );
                      })}
                    </div>
                    {productErrors?.tenors?.message && (
                      <p role="alert" className="text-xs font-medium text-destructive">
                        {productErrors.tenors.message}
                      </p>
                    )}
                  </fieldset>
                )}
              />
            </CardContent>
          </Card>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            id: `${slug}-prd-${Date.now().toString(36)}`,
            name: "",
            description: "",
            minAmount: 10_000,
            maxAmount: 500_000,
            interestRate: 20,
            tenors: [3, 6],
          })
        }
      >
        <Plus />
        Add product
      </Button>
    </div>
  );
}
