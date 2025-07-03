import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TenantSidebar } from "@/components/tenant/TenantSidebar";
import { UserMenu } from "@/components/UserMenu";
import TenantDashboard from "@/pages/tenant/TenantDashboard";
import ClientsPage from "@/pages/tenant/ClientsPage";
import LoansPage from "@/pages/tenant/LoansPage";
import SavingsPage from "@/pages/tenant/SavingsPage";
import TransactionsPage from "@/pages/tenant/TransactionsPage";
import GroupsPage from "@/pages/tenant/GroupsPage";
import SettingsPage from "@/pages/tenant/SettingsPage";

const TenantLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TenantSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <SidebarTrigger />
            <UserMenu />
          </div>
          <div className="p-6">
            <Routes>
              <Route path="/" element={<TenantDashboard />} />
              <Route path="/dashboard" element={<TenantDashboard />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TenantLayout;