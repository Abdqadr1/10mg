"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import { applyThemeVars } from "@/lib/theme";
import type { Tenant } from "@/types";

const TenantContext = createContext<Tenant | null>(null);

export function TenantThemeScope({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const { branding, name } = tenant;

  useEffect(() => applyThemeVars(document.documentElement, branding), [branding]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${name} · Credit`;
    return () => {
      document.title = previous;
    };
  }, [name]);

  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const tenant = useContext(TenantContext);
  if (!tenant) throw new Error("useTenant must be used inside a TenantProvider");
  return tenant;
}

export function useMoney() {
  const { settings } = useTenant();
  return useCallback(
    (amount: number, options?: { compact?: boolean }) => formatMoney(amount, settings.currency, options),
    [settings.currency],
  );
}
