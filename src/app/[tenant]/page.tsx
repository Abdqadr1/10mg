"use client";

import Link from "next/link";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HOME_BY_ROLE } from "@/features/auth/require-auth";
import { LoanCalculator } from "@/features/portal/loan-calculator";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/auth-store";

const HIGHLIGHTS = [
  { icon: Clock, title: "Decisions in hours", body: "Apply online and track every step of your application." },
  { icon: ShieldCheck, title: "Transparent pricing", body: "See your full repayment schedule before you accept." },
  { icon: BadgeCheck, title: "Licensed & regulated", body: "Your data stays private and is never shared." },
];

export default function TenantHome() {
  const tenant = useTenant();
  const money = useMoney();
  const session = useSession(tenant.slug);
  const portalHref = `/${tenant.slug}/portal`;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <TenantLogo tenant={tenant} showName />
          <nav className="ml-auto flex items-center gap-2">
            {session ? (
              <Link href={`/${tenant.slug}/${HOME_BY_ROLE[session.user.role]}`} className={buttonVariants()}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href={`/${tenant.slug}/login`} className={buttonVariants({ variant: "ghost" })}>
                  Sign in
                </Link>
                <Link href={`/${tenant.slug}/register`} className={cn(buttonVariants(), "hidden sm:inline-flex")}>
                  Open an account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
            <div className="flex flex-col justify-center space-y-6">
              <span className="w-fit rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-brand-accent-foreground">
                Loans up to {money(Math.max(...tenant.products.map((product) => product.maxAmount)), { compact: true })}
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{tenant.tagline}</h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Apply for credit from {tenant.name} in a few minutes, get a decision fast, and manage repayments from your phone.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`${portalHref}/apply`} className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>
                  Start an application
                </Link>
                <Link href={`/${tenant.slug}/login`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}>
                  Track my loan
                </Link>
              </div>
            </div>
            <Card className="shadow-lg">
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold">Estimate your repayments</h2>
                <LoanCalculator ctaHref={`${portalHref}/apply`} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="space-y-2 rounded-(--radius) border p-5">
                <item.icon className="size-5 text-primary" />
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="mb-4 text-xl font-semibold">Our products</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tenant.products.map((product) => (
              <Card key={product.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{product.interestRate}% p.a.</span>
                  </div>
                  <p className="text-sm">
                    {money(product.minAmount)} – {money(product.maxAmount)} · {product.tenors.join(", ")} months
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {tenant.name} · Support: {tenant.supportEmail} · Powered by 10MG Credit
      </footer>
    </div>
  );
}
