"use client";

import type { ReactNode } from "react";
import { FullPageLoader } from "@/components/feedback/full-page-loader";
import { NotFoundState } from "@/components/feedback/not-found-state";
import { ErrorState } from "@/components/feedback/error-state";
import { isApiError } from "@/lib/api/client";
import { useTenantQuery } from "./api";
import { TenantThemeScope } from "./tenant-context";

export function TenantProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { data: tenant, isPending, error, refetch } = useTenantQuery(slug);

  if (isPending) return <FullPageLoader label="Loading institution" />;
  if (error) {
    if (isApiError(error) && error.status === 404) {
      return <NotFoundState title="Institution not found" description={`No lender is registered at “/${slug}”.`} />;
    }
    return <ErrorState className="min-h-dvh" error={error} onRetry={() => refetch()} />;
  }
  return <TenantThemeScope tenant={tenant}>{children}</TenantThemeScope>;
}
