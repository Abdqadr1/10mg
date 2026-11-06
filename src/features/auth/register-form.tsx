"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/features/tenants/tenant-context";
import { registerSchema, type RegisterInput } from "@/lib/schemas";
import { useRegister } from "./api";

export function RegisterForm() {
  const tenant = useTenant();
  const router = useRouter();
  const registration = useRegister(tenant.slug);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((input) => {
    setFormError(null);
    registration.mutate(input, {
      onSuccess: () => router.replace(`/${tenant.slug}/portal/apply`),
      onError: (error) => setFormError(applyServerErrors(error, setError)),
    });
  });

  const text = (name: keyof RegisterInput, label: string, type = "text", autoComplete?: string) => (
    <FormField id={name} label={label} error={errors[name]?.message}>
      <Input {...fieldA11y(name, errors[name]?.message)} type={type} autoComplete={autoComplete} className="h-10" {...register(name)} />
    </FormField>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        {text("firstName", "First name", "text", "given-name")}
        {text("lastName", "Last name", "text", "family-name")}
      </div>
      {text("email", "Email", "email", "email")}
      {text("phone", "Phone number", "tel", "tel")}
      {text("password", "Password", "password", "new-password")}
      {text("confirmPassword", "Confirm password", "password", "new-password")}
      <Button type="submit" size="lg" className="h-10 w-full" disabled={registration.isPending}>
        {registration.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/${tenant.slug}/login`} className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
