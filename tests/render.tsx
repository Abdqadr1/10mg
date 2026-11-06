import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createQueryClient } from "@/components/providers";
import { TenantThemeScope } from "@/features/tenants/tenant-context";
import { db } from "@/mocks/db";

export function tenantFixture(slug = "aurora") {
  const tenant = db().tenants.find((item) => item.slug === slug);
  if (!tenant) throw new Error(`Unknown tenant ${slug}`);
  return structuredClone(tenant);
}

export function renderWithTenant(ui: ReactNode, slug = "aurora") {
  const queryClient = createQueryClient();
  const tenant = tenantFixture(slug);
  return {
    tenant,
    ...render(
      <QueryClientProvider client={queryClient}>
        <TenantThemeScope tenant={tenant}>{ui}</TenantThemeScope>
      </QueryClientProvider>,
    ),
  };
}
