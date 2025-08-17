import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { UserMenu } from "@/components/UserMenu";

// Lazy load pages for better performance
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin/SuperAdminDashboard"));
const TenantsPage = lazy(() => import("@/pages/super-admin/TenantsPage"));
const BillingPage = lazy(() => import("@/pages/super-admin/BillingPage"));
const IntegrationsPage = lazy(() => import("@/pages/super-admin/IntegrationsPage"));
const SettingsPage = lazy(() => import("@/pages/super-admin/SettingsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-muted-foreground">Loading...</span>
    </div>
  </div>
);

const SuperAdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <SidebarTrigger />
            <UserMenu />
          </div>
          <div className="p-6">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<SuperAdminDashboard />} />
                <Route path="/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;