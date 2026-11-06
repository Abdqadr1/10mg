import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/tenant-context";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { DecisionInput } from "@/lib/schemas";
import type {
  ApplicationReview,
  CustomerOverview,
  CustomerSummary,
  DashboardStats,
  Loan,
  LoanApplication,
  LoanDetail,
  Repayment,
} from "@/types";

function useLenderQuery<T>(key: readonly unknown[], path: string, enabled = true) {
  const { slug } = useTenant();
  return useQuery({
    queryKey: key,
    queryFn: () => apiFetch<T>(`/tenants/${slug}/lender${path}`, { tenant: slug }),
    enabled,
  });
}

export function useDashboard() {
  const { slug } = useTenant();
  return useLenderQuery<DashboardStats>(queryKeys.dashboard(slug), "/dashboard");
}

export function useApplications() {
  const { slug } = useTenant();
  return useLenderQuery<LoanApplication[]>(queryKeys.applications(slug), "/applications");
}

export function useApplicationReview(id: string | null) {
  const { slug } = useTenant();
  return useLenderQuery<ApplicationReview>(queryKeys.applicationReview(slug, id ?? ""), `/applications/${id}`, Boolean(id));
}

export function useDecideApplication() {
  const { slug } = useTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: DecisionInput & { id: string }) =>
      apiFetch<LoanApplication>(`/tenants/${slug}/lender/applications/${id}/decision`, { method: "POST", body: input, tenant: slug }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-data", slug] }),
  });
}

export function useCustomers() {
  const { slug } = useTenant();
  return useLenderQuery<CustomerSummary[]>(queryKeys.customers(slug), "/customers");
}

export function useCustomer(id: string | null) {
  const { slug } = useTenant();
  return useLenderQuery<CustomerOverview>(queryKeys.customer(slug, id ?? ""), `/customers/${id}`, Boolean(id));
}

export function useLoans() {
  const { slug } = useTenant();
  return useLenderQuery<Loan[]>(queryKeys.loans(slug), "/loans");
}

export function useLenderLoan(id: string | null) {
  const { slug } = useTenant();
  return useLenderQuery<LoanDetail>(queryKeys.lenderLoan(slug, id ?? ""), `/loans/${id}`, Boolean(id));
}

export function useRepayments() {
  const { slug } = useTenant();
  return useLenderQuery<Repayment[]>(queryKeys.repayments(slug), "/repayments");
}
