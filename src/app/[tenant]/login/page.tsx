"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/features/auth/auth-layout";
import { LoginForm } from "@/features/auth/login-form";
import { useTenant } from "@/features/tenants/tenant-context";

export default function LoginPage() {
  const tenant = useTenant();
  return (
    <AuthLayout title={`Sign in to ${tenant.name}`} description="Customers and lending staff sign in here.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
