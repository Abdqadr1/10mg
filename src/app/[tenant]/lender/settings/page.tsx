"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/features/settings/settings-form";
import { useTenant } from "@/features/tenants/tenant-context";

export default function SettingsPage() {
  const tenant = useTenant();
  return (
    <>
      <PageHeader title="White-label settings" description="Configure your brand, loan products and lending policies." />
      <SettingsForm key={tenant.id} tenant={tenant} />
    </>
  );
}
