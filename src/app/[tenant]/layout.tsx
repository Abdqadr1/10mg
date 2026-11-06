import type { ReactNode } from "react";
import { TenantProvider } from "@/features/tenants/tenant-provider";

export default async function TenantLayout({ children, params }: { children: ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <TenantProvider slug={tenant}>{children}</TenantProvider>;
}
