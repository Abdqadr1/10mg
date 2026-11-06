import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/tenant-context";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApplicationInput, RepaymentInput } from "@/lib/schemas";
import type { CustomerOverview, LoanApplication, LoanDetail, Repayment } from "@/types";

export function useOverview() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: queryKeys.overview(slug),
    queryFn: () => apiFetch<CustomerOverview>(`/tenants/${slug}/me/overview`, { tenant: slug }),
  });
}

export function useMyLoan(id: string) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: queryKeys.myLoan(slug, id),
    queryFn: () => apiFetch<LoanDetail>(`/tenants/${slug}/me/loans/${id}`, { tenant: slug }),
  });
}

export function useMyRepayments() {
  const { slug } = useTenant();
  return useQuery({
    queryKey: queryKeys.myRepayments(slug),
    queryFn: () => apiFetch<Repayment[]>(`/tenants/${slug}/me/repayments`, { tenant: slug }),
  });
}

export function useCreateApplication() {
  const { slug } = useTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationInput) =>
      apiFetch<LoanApplication>(`/tenants/${slug}/me/applications`, { method: "POST", body: input, tenant: slug }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-data", slug] }),
  });
}

export function useMakeRepayment(loanId: string) {
  const { slug } = useTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RepaymentInput) =>
      apiFetch<Repayment>(`/tenants/${slug}/me/loans/${loanId}/repayments`, { method: "POST", body: input, tenant: slug }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-data", slug] }),
  });
}
