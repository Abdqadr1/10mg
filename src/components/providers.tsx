"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isApiError } from "@/lib/api/client";
import { MockApiGate } from "./mock-api-gate";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !(isApiError(error) && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <MockApiGate>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster theme="light" position="top-center" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </MockApiGate>
  );
}
