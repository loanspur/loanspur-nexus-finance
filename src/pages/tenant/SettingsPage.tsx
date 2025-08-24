import { ProfileSettings } from "@/components/ProfileSettings";
import { TenantProfileManagement } from "@/components/tenant/TenantProfileManagement";
import { SystemCodesManagement } from "@/components/tenant/SystemCodesManagement";
import { LoanMigrationPanel } from "@/components/loan/LoanMigrationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Building2, 
  Settings2, 
  Shield, 
  CreditCard, 
  Bell, 
  Database, 
  Users,
  FileText,
  Workflow
} from "lucide-react";

const SettingsPage = () => {
  const settingsTabs = [
    {
      value: "profile",
      label: "Personal Profile",
      icon: User,
      description: "Manage your personal account settings"
    },
    {
      value: "organization",
      label: "Organization",
      icon: Building2,
      description: "Manage organization details and settings"
    },
    {
      value: "system-codes",
      label: "System Codes",
      icon: Settings2,
      description: "Configure dropdown values and system parameters"
    },
    {
      value: "security",
      label: "Security",
      icon: Shield,
      description: "Password, 2FA, and security settings",
      disabled: true,
      badge: "Coming Soon"
    },
    {
      value: "billing",
      label: "Billing",
      icon: CreditCard,
      description: "Subscription and payment settings",
      disabled: true,
      badge: "Coming Soon"
    },
    {
      value: "notifications",
      label: "Notifications", 
      icon: Bell,
      description: "Email and push notification preferences",
      disabled: true,
      badge: "Coming Soon"
    },
    {
      value: "data",
      label: "Data Management",
      icon: Database,
      description: "Loan migration and data synchronization"
    },
    {
      value: "users",
      label: "User Management",
      icon: Users,
      description: "Manage team members and permissions",
      disabled: true,
      badge: "Coming Soon"
    },
    {
      value: "reports",
      label: "Reports",
      icon: FileText,
      description: "Configure custom reports and templates",
      disabled: true,
      badge: "Coming Soon"
    },
    {
      value: "workflows",
      label: "Workflows",
      icon: Workflow,
      description: "Approval workflows and automation",
      disabled: true,
      badge: "Coming Soon"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full" orientation="horizontal">
        <div className="border-b">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto w-max min-w-full p-1 bg-transparent">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={tab.disabled}
                    className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary min-w-max"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>
        </div>
        
        <div className="mt-6">
          <TabsContent value="profile" className="space-y-6 mt-0">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Personal Profile</h2>
              <p className="text-sm text-muted-foreground">
                Manage your personal account settings and preferences.
              </p>
            </div>
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="organization" className="space-y-6 mt-0">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Organization Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure your organization details and global settings.
              </p>
            </div>
            <TenantProfileManagement />
          </TabsContent>
          
          <TabsContent value="system-codes" className="space-y-6 mt-0">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">System Codes</h2>
              <p className="text-sm text-muted-foreground">
                Configure dropdown values and system parameters used throughout the application.
              </p>
            </div>
            <SystemCodesManagement />
          </TabsContent>

          <TabsContent value="data" className="space-y-6 mt-0">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Data Management</h2>
              <p className="text-sm text-muted-foreground">
                Synchronize existing loans with the unified transaction management system.
              </p>
            </div>
            <LoanMigrationPanel />
          </TabsContent>

          {/* Placeholder content for coming soon tabs */}
          {settingsTabs
            .filter(tab => tab.disabled && tab.value !== 'data')
            .map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsContent key={tab.value} value={tab.value} className="space-y-6 mt-0">
                  <div className="text-center py-12">
                    <IconComponent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{tab.label}</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {tab.description}
                    </p>
                    <Badge variant="outline" className="mt-4">
                      Coming Soon
                    </Badge>
                  </div>
                </TabsContent>
              );
            })}
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;