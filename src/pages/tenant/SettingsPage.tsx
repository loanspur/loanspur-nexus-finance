import { ProfileSettings } from "@/components/ProfileSettings";
import { TenantProfileManagement } from "@/components/tenant/TenantProfileManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Personal Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="organization" className="space-y-6">
          <TenantProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;