"use client";

import { CRMStoreProvider } from "@/store/CRMStoreProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CRMStoreProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </CRMStoreProvider>
    </QueryClientProvider>
  );
}
