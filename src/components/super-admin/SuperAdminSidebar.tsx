import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";

const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
          <h2 className="text-lg font-semibold text-primary">LoanSpur CBS</h2>
          <p className="text-sm text-muted-foreground">Super Admin</p>
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