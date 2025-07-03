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
import NotificationsPage from "@/pages/tenant/NotificationsPage";
import DocumentManagementPage from "@/pages/tenant/DocumentManagementPage";
import ReconciliationPage from "@/pages/tenant/ReconciliationPage";

const TenantLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gradient-hero">
        <TenantSidebar />
        <main className="flex-1 overflow-auto">
          {/* Enhanced header */}
          <div className="sticky top-0 z-40 flex items-center justify-between p-6 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-heading font-semibold text-foreground">LoanSpur CBS</h1>
                <p className="text-xs text-muted-foreground">Tenant Dashboard</p>
              </div>
            </div>
            <UserMenu />
          </div>
          
          {/* Enhanced content area */}
          <div className="p-6 space-y-6 min-h-full bg-gradient-to-br from-background via-background to-muted/20">
            <Routes>
              <Route path="/" element={<TenantDashboard />} />
              <Route path="/dashboard" element={<TenantDashboard />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/documents" element={<DocumentManagementPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TenantLayout;