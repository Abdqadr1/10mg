"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { FormError, FormField, fieldA11y } from "@/components/forms/form-field";
import { applyServerErrors } from "@/components/forms/apply-server-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/features/tenants/tenant-context";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { SEED_TENANTS, demoCredentials } from "@/mocks/seed/tenants";
import type { Role } from "@/types";
import { useLogin } from "./api";
import { HOME_BY_ROLE } from "./require-auth";

type Audience = "customer" | "staff";

export function LoginForm() {
  const tenant = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin(tenant.slug);
  const [audience, setAudience] = useState<Audience>(searchParams.get("as") === "staff" ? "staff" : "customer");
  const [formError, setFormError] = useState<string | null>(null);
  const isDemoTenant = SEED_TENANTS.some((item) => item.slug === tenant.slug);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const redirectFor = (role: Role) => {
    const area = `/${tenant.slug}/${HOME_BY_ROLE[role]}`;
    const next = searchParams.get("next");
    return next && next.startsWith(area) ? next : area;
  };

  const onSubmit = handleSubmit((input) => {
    setFormError(null);
    login.mutate(input, {
      onSuccess: (session) => router.replace(redirectFor(session.user.role)),
      onError: (error) => setFormError(applyServerErrors(error, setError)),
    });
  });

  const fillDemo = () => {
    const credentials = demoCredentials(tenant.slug)[audience === "staff" ? "admin" : "customer"];
    setValue("email", credentials.email, { shouldValidate: true });
    setValue("password", credentials.password, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <Tabs value={audience} onValueChange={(value) => setAudience(value as Audience)}>
        <TabsList className="w-full">
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
      </Tabs>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormError message={formError} />
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input {...fieldA11y("email", errors.email?.message)} type="email" autoComplete="email" className="h-10" {...register("email")} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input {...fieldA11y("password", errors.password?.message)} type="password" autoComplete="current-password" className="h-10" {...register("password")} />
        </FormField>
        <Button type="submit" size="lg" className="h-10 w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : audience === "staff" ? "Sign in to lender console" : "Sign in"}
        </Button>
      </form>

      {isDemoTenant && (
        <div className="space-y-2 rounded-(--radius) border border-dashed p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <KeyRound className="size-4 text-primary" />
            Demo {audience === "staff" ? "lender admin" : "customer"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {demoCredentials(tenant.slug)[audience === "staff" ? "admin" : "customer"].email} / {demoCredentials(tenant.slug).admin.password}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={fillDemo}>
            Use demo credentials
          </Button>
        </div>
      )}

      {audience === "customer" && (
        <p className="text-center text-sm text-muted-foreground">
          New to {tenant.name}?{" "}
          <Link href={`/${tenant.slug}/register`} className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </div>
  );
}
