import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppRouter } from "./components/AppRouter";
import { DevToolsBar } from "@/components/dev/DevToolsBar";
import { useDataOptimization } from "@/hooks/useOptimizedQueries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <AppRouter />
              <Toaster />
              <Sonner />
              {import.meta.env.DEV && <DevToolsBar />}
            </TooltipProvider>
          </CurrencyProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
