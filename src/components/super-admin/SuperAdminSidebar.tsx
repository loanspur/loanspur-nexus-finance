import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTenantSwitching } from "@/contexts/TenantSwitchingContext";
import { Building2, Users } from "lucide-react";

const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedTenant } = useTenantSwitching();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/super-admin/dashboard"
    },
    {
      title: "Tenants",
      path: "/super-admin/tenants"
    },
    {
      title: "Billing",
      path: "/super-admin/billing"
    },
    {
      title: "Integrations",
      path: "/super-admin/integrations"
    },
    {
      title: "Settings",
      path: "/super-admin/settings"
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center space-x-2">
            {selectedTenant ? <Building2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            <div>
              <h2 className="text-lg font-semibold text-primary">LoanSpur CBS</h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {selectedTenant ? `Viewing: ${selectedTenant.name}` : 'Super Admin'}
                </p>
                {selectedTenant && (
                  <Badge variant="secondary" className="text-xs">Dev Mode</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                  >
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export { SuperAdminSidebar };