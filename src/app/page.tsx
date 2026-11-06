"use client";

import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/error-state";
import { PlatformHeader } from "@/components/layout/platform-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useResetDemo, useTenants } from "@/features/tenants/api";
import { TenantCard } from "@/features/tenants/tenant-card";
import { useAuthStore } from "@/stores/auth-store";

export default function PlatformHome() {
  const { data: tenants, isPending, error, refetch } = useTenants();
  const reset = useResetDemo();

  const handleReset = () =>
    reset.mutate(undefined, {
      onSuccess: () => {
        useAuthStore.setState({ sessions: {} });
        toast.success("Demo data restored to its original state");
      },
    });

  return (
    <div className="min-h-dvh bg-neutral-50">
      <PlatformHeader active="institutions" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-neutral-500">One platform · many lenders</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Launch a fully branded credit product without building a lending stack.
            </h1>
            <p className="text-neutral-600">
              Every institution below runs on the same 10MG Credit codebase, with its own branding, products, policies and isolated customer data.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={handleReset} disabled={reset.isPending}>
              <RotateCcw />
              Reset demo
            </Button>
            <Link href="/platform" className={buttonVariants()}>
              <Plus />
              Onboard institution
            </Link>
          </div>
        </section>

        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
