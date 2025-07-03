import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TenantSidebar } from "@/components/tenant/TenantSidebar";
import TenantDashboard from "@/pages/tenant/TenantDashboard";
import ClientsPage from "@/pages/tenant/ClientsPage";
import LoansPage from "@/pages/tenant/LoansPage";
import SavingsPage from "@/pages/tenant/SavingsPage";
import GroupsPage from "@/pages/tenant/GroupsPage";

const TenantLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TenantSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <SidebarTrigger className="mb-4" />
            <Routes>
              <Route path="/" element={<TenantDashboard />} />
              <Route path="/dashboard" element={<TenantDashboard />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TenantLayout;