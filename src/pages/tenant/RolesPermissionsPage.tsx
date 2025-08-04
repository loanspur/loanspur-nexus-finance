import { RolePermissionManagement } from "@/components/tenant/RolePermissionManagement";
import { EnhancedRolePermissionManagement } from "@/components/tenant/EnhancedRolePermissionManagement";
import { CustomRoleManagement } from "@/components/tenant/CustomRoleManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Settings, Zap } from "lucide-react";

const RolesPermissionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
      </div>
      
      <Tabs defaultValue="enhanced-permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhanced-permissions" className="gap-2">
            <Zap className="h-4 w-4" />
            Enhanced Permissions
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Settings className="h-4 w-4" />
            Basic Permissions
          </TabsTrigger>
          <TabsTrigger value="custom-roles" className="gap-2">
            <Users className="h-4 w-4" />
            Custom Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced-permissions" className="mt-6">
          <EnhancedRolePermissionManagement />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <RolePermissionManagement />
        </TabsContent>

        <TabsContent value="custom-roles" className="mt-6">
          <CustomRoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissionsPage;