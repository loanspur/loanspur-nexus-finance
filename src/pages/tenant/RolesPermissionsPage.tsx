import { UnifiedRolePermissionManagement } from "@/components/tenant/UnifiedRolePermissionManagement";
import { Shield } from "lucide-react";

const RolesPermissionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
      </div>
      
      <UnifiedRolePermissionManagement />
    </div>
  );
};

export default RolesPermissionsPage;