"use client";

import type { ReactNode } from "react";
import { FileText, HandCoins, LayoutDashboard, Receipt, Settings, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { useTenant } from "@/features/tenants/tenant-context";

export default function LenderLayout({ children }: { children: ReactNode }) {
  const { slug } = useTenant();
  const base = `/${slug}/lender`;
  const nav: NavItem[] = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/applications`, label: "Applications", icon: FileText },
    { href: `${base}/loans`, label: "Loans", icon: HandCoins },
    { href: `${base}/customers`, label: "Customers", icon: Users },
    { href: `${base}/repayments`, label: "Repayments", icon: Receipt },
    { href: `${base}/settings`, label: "White-label settings", icon: Settings },
  ];

  return (
    <RequireAuth role="lender_admin">
      <AppShell area="Lender console" nav={nav}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
