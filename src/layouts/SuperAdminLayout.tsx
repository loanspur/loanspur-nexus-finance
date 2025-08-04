import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { UserMenu } from "@/components/UserMenu";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import TenantsPage from "@/pages/super-admin/TenantsPage";
import BillingPage from "@/pages/super-admin/BillingPage";
import IntegrationsPage from "@/pages/super-admin/IntegrationsPage";
import SettingsPage from "@/pages/super-admin/SettingsPage";

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
            <Routes>
              <Route path="/" element={<SuperAdminDashboard />} />
              <Route path="/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;