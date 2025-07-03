import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { UserMenu } from "@/components/UserMenu";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientLoansPage from "@/pages/client/ClientLoansPage";
import ClientSavingsPage from "@/pages/client/ClientSavingsPage";
import ClientPaymentsPage from "@/pages/client/ClientPaymentsPage";
import SettingsPage from "@/pages/client/SettingsPage";

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
            <Routes>
              <Route path="/" element={<ClientDashboard />} />
              <Route path="/dashboard" element={<ClientDashboard />} />
              <Route path="/loans" element={<ClientLoansPage />} />
              <Route path="/savings" element={<ClientSavingsPage />} />
              <Route path="/payments" element={<ClientPaymentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ClientLayout;