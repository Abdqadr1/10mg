import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session } from "@/types";

interface AuthState {
  sessions: Record<string, Session>;
  setSession: (tenantSlug: string, session: Session) => void;
  clearSession: (tenantSlug: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sessions: {},
      setSession: (tenantSlug, session) => set((state) => ({ sessions: { ...state.sessions, [tenantSlug]: session } })),
      clearSession: (tenantSlug) =>
        set((state) => {
          const { [tenantSlug]: _removed, ...rest } = state.sessions;
          return { sessions: rest };
        }),
    }),
    {
      name: "10mg-credit-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useSession(tenantSlug: string) {
  return useAuthStore((state) => state.sessions[tenantSlug] ?? null);
}

export function getToken(tenantSlug: string) {
  return useAuthStore.getState().sessions[tenantSlug]?.token ?? null;
}
