import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { OnboardTenantInput, TenantSettingsInput } from "@/lib/schemas";
import type { Tenant } from "@/types";

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: () => apiFetch<Tenant[]>("/tenants"),
  });
}

export function useTenantQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.tenant(slug),
    queryFn: () => apiFetch<Tenant>(`/tenants/${slug}`),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateTenant(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantSettingsInput) => apiFetch<Tenant>(`/tenants/${slug}`, { method: "PATCH", body: input, tenant: slug }),
    onSuccess: (tenant) => {
      queryClient.setQueryData(queryKeys.tenant(slug), tenant);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants, exact: true });
      queryClient.invalidateQueries({ queryKey: ["tenant-data", slug] });
    },
  });
}

export function useOnboardTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardTenantInput) => apiFetch<Tenant>("/tenants", { method: "POST", body: input }),
    onSuccess: (tenant) => {
      queryClient.setQueryData(queryKeys.tenant(tenant.slug), tenant);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants, exact: true });
    },
  });
}

export function useResetDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>("/demo/reset", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
