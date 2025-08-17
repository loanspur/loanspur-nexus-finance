import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { TenantRouter } from "./components/TenantRouter";
import { MainSiteRouter } from "./components/MainSiteRouter";
import { DevToolsBar } from "@/components/dev/DevToolsBar";
import { useDataOptimization } from "@/hooks/useOptimizedQueries";
import { getCurrentSubdomain } from "@/utils/tenant";
import { LoanClosureNotification } from "@/components/notifications/LoanClosureNotification";

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

// Router component that determines which router to use using shared util (no context usage)
const AppRouter = () => {
  const subdomain = getCurrentSubdomain();
  const isSubdomainTenant = !!subdomain;

  useDataOptimization();
  return isSubdomainTenant ? <TenantRouter /> : <MainSiteRouter />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRouter />
              <DevToolsBar />
              <LoanClosureNotification />
            </TooltipProvider>
          </CurrencyProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
