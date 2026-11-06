import Link from "next/link";
import { ArrowRight, Briefcase, UserRound } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { themeStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/types";

export function TenantCard({ tenant }: { tenant: Tenant }) {
  const maxAmount = Math.max(...tenant.products.map((product) => product.maxAmount));
  const minRate = Math.min(...tenant.products.map((product) => product.interestRate));

  return (
    <article
      style={themeStyle(tenant.branding)}
      className="flex flex-col overflow-hidden rounded-(--radius) border bg-card font-sans shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-20 bg-primary">
        <div className="absolute -bottom-6 left-5 rounded-(--radius) bg-card p-1.5 shadow-sm">
          <TenantLogo tenant={tenant} size="lg" />
        </div>
        <span className="absolute top-3 right-3 rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-semibold text-brand-accent-foreground">
          {tenant.settings.currency}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pt-9 pb-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{tenant.name}</h2>
          <p className="text-sm text-muted-foreground">{tenant.tagline}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-(--radius) bg-accent px-2 py-2">
            <dt className="text-[11px] text-muted-foreground">Products</dt>
            <dd className="text-sm font-semibold text-accent-foreground">{tenant.products.length}</dd>
          </div>
          <div className="rounded-(--radius) bg-accent px-2 py-2">
            <dt className="text-[11px] text-muted-foreground">Up to</dt>
            <dd className="truncate text-sm font-semibold text-accent-foreground">{formatMoney(maxAmount, tenant.settings.currency, { compact: true })}</dd>
          </div>
          <div className="rounded-(--radius) bg-accent px-2 py-2">
            <dt className="text-[11px] text-muted-foreground">From</dt>
            <dd className="text-sm font-semibold text-accent-foreground">{minRate}% p.a.</dd>
          </div>
        </dl>
        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Link href={`/${tenant.slug}`} className={cn(buttonVariants(), "h-9 rounded-(--radius)")}>
            <UserRound />
            Customer portal
          </Link>
          <Link href={`/${tenant.slug}/login?as=staff`} className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-(--radius)")}>
            <Briefcase />
            Lender console
            <ArrowRight className="ml-auto sm:hidden" />
          </Link>
        </div>
      </div>
    </article>
  );
}
