"use client";

import type { ReactNode } from "react";
import { FilePlus2, HandCoins, LayoutDashboard, Receipt } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { useTenant } from "@/features/tenants/tenant-context";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { slug } = useTenant();
  const base = `/${slug}/portal`;
  const nav: NavItem[] = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/apply`, label: "Apply for a loan", icon: FilePlus2 },
    { href: `${base}/loans`, label: "My loans", icon: HandCoins },
    { href: `${base}/repayments`, label: "Repayment history", icon: Receipt },
  ];

  return (
    <RequireAuth role="customer">
      <AppShell area="Customer portal" nav={nav}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
