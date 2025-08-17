import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TenantSidebar } from "@/components/tenant/TenantSidebar";
import { UserMenu } from "@/components/UserMenu";
import ActivityTracker from "@/components/audit/ActivityTracker";

// Lazy load pages for better performance
const TenantDashboard = lazy(() => import("@/pages/tenant/TenantDashboard"));
const ClientsPage = lazy(() => import("@/pages/tenant/ClientsPage"));
const ClientDetailsPage = lazy(() => import("@/pages/client/ClientDetailsPage"));
const LoansPage = lazy(() => import("@/pages/tenant/LoansPage"));
const SavingsPage = lazy(() => import("@/pages/tenant/SavingsPage"));
const TransactionsPage = lazy(() => import("@/pages/tenant/TransactionsPage"));
const GroupsPage = lazy(() => import("@/pages/tenant/GroupsPage"));
const SettingsPage = lazy(() => import("@/pages/tenant/SettingsPage"));
const NotificationsPage = lazy(() => import("@/pages/tenant/NotificationsPage"));
const DocumentManagementPage = lazy(() => import("@/pages/tenant/DocumentManagementPage"));
const ReconciliationPage = lazy(() => import("@/pages/tenant/ReconciliationPage"));
const FinancialReportsPage = lazy(() => import("@/pages/tenant/FinancialReportsPage"));
const AuditCompliancePage = lazy(() => import("@/pages/tenant/AuditCompliancePage"));
const UserManagementPage = lazy(() => import("@/pages/tenant/UserManagementPage"));
const OfficeManagementPage = lazy(() => import("@/pages/tenant/OfficeManagementPage"));
const CurrencyConfigPage = lazy(() => import("@/pages/tenant/CurrencyConfigPage"));
const FundsManagementPage = lazy(() => import("@/pages/tenant/FundsManagementPage"));
const ProductFeeManagementPage = lazy(() => import("@/pages/tenant/ProductFeeManagementPage"));
const AccountingPage = lazy(() => import("@/pages/tenant/AccountingPage"));
const LoanWorkflowPage = lazy(() => import("@/pages/tenant/LoanWorkflowPage"));
const LoanApprovalPage = lazy(() => import("@/pages/tenant/LoanApprovalPage"));
const ClientLoanReviewPage = lazy(() => import("@/pages/tenant/ClientLoanReviewPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-muted-foreground">Loading...</span>
    </div>
  </div>
);

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
            <ActivityTracker />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<TenantDashboard />} />
                <Route path="/dashboard" element={<TenantDashboard />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/:clientId" element={<ClientDetailsPage />} />
                <Route path="/loans" element={<LoansPage />} />
                <Route path="/loan-workflow" element={<LoanWorkflowPage />} />
                <Route path="/loan-approval" element={<LoanApprovalPage />} />
                <Route path="/client-loan-review" element={<ClientLoanReviewPage />} />
                <Route path="/savings" element={<SavingsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/documents" element={<DocumentManagementPage />} />
                <Route path="/reconciliation" element={<ReconciliationPage />} />
                <Route path="/reports" element={<FinancialReportsPage />} />
                <Route path="/audit" element={<AuditCompliancePage />} />
                <Route path="/user-management" element={<UserManagementPage />} />
                <Route path="/office-management" element={<OfficeManagementPage />} />
                <Route path="/currency-config" element={<CurrencyConfigPage />} />
                <Route path="/funds-management" element={<FundsManagementPage />} />
                <Route path="/product-fee-management" element={<ProductFeeManagementPage />} />
                <Route path="/accounting" element={<AccountingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TenantLayout;