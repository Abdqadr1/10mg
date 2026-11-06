import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import { useAuthStore } from "@/stores/auth-store";
import type { Session } from "@/types";

export function useLogin(slug: string) {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => apiFetch<Session>(`/tenants/${slug}/auth/login`, { method: "POST", body: input }),
    onSuccess: (session) => setSession(slug, session),
  });
}

export function useRegister(slug: string) {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) => apiFetch<Session>(`/tenants/${slug}/auth/register`, { method: "POST", body: input }),
    onSuccess: (session) => setSession(slug, session),
  });
}

export function useLogout(slug: string) {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  return () => {
    clearSession(slug);
    queryClient.removeQueries({ queryKey: ["tenant-data", slug] });
  };
}
