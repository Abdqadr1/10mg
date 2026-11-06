"use client";

import { AuthLayout } from "@/features/auth/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";
import { useTenant } from "@/features/tenants/tenant-context";

export default function RegisterPage() {
  const tenant = useTenant();
  return (
    <AuthLayout title="Create your account" description={`Open a ${tenant.name} account to apply for credit.`}>
      <RegisterForm />
    </AuthLayout>
  );
}
