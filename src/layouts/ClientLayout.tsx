import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { UserMenu } from "@/components/UserMenu";

// Lazy load pages for better performance
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard"));
const ClientLoansPage = lazy(() => import("@/pages/client/ClientLoansPage"));
const ClientSavingsPage = lazy(() => import("@/pages/client/ClientSavingsPage"));
const ClientPaymentsPage = lazy(() => import("@/pages/client/ClientPaymentsPage"));
const SettingsPage = lazy(() => import("@/pages/client/SettingsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-muted-foreground">Loading...</span>
    </div>
  </div>
);

const ClientLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ClientSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <SidebarTrigger />
            <UserMenu />
          </div>
          <div className="p-6">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<ClientDashboard />} />
                <Route path="/dashboard" element={<ClientDashboard />} />
                <Route path="/loans" element={<ClientLoansPage />} />
                <Route path="/savings" element={<ClientSavingsPage />} />
                <Route path="/payments" element={<ClientPaymentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ClientLayout;