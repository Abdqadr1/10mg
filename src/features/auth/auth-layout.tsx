import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { useTenant } from "@/features/tenants/tenant-context";

export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const tenant = useTenant();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div aria-hidden className="absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-accent opacity-25 blur-2xl" />
        <Link href={`/${tenant.slug}`} className="relative w-fit rounded-(--radius) bg-background/95 px-3 py-2 text-foreground">
          <TenantLogo tenant={tenant} showName />
        </Link>
        <div className="relative space-y-3">
          <p className="text-3xl font-semibold tracking-tight text-balance">{tenant.tagline}</p>
          <p className="text-primary-foreground/80">Secure access to your {tenant.name} account.</p>
        </div>
        <p className="relative text-xs text-primary-foreground/70">Powered by 10MG Credit</p>
      </aside>
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href={`/${tenant.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="lg:hidden">
            <TenantLogo tenant={tenant} size="sm" showName />
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
