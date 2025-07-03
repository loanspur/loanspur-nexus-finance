import { Routes, Route } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import TenantsPage from "@/pages/super-admin/TenantsPage";
import BillingPage from "@/pages/super-admin/BillingPage";

const SuperAdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <SidebarTrigger className="mb-4" />
            <Routes>
              <Route path="/" element={<SuperAdminDashboard />} />
              <Route path="/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/billing" element={<BillingPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;