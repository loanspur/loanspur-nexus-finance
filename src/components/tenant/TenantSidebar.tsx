import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";

const TenantSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/tenant/dashboard"
    },
    {
      title: "Clients",
      path: "/tenant/clients"
    },
    {
      title: "Loans",
      path: "/tenant/loans"
    },
    {
      title: "Savings",
      path: "/tenant/savings"
    },
    {
      title: "Groups",
      path: "/tenant/groups"
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-primary">LoanSpur CBS</h2>
          <p className="text-sm text-muted-foreground">Tenant Admin</p>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Core Banking</SidebarGroupLabel>
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

export { TenantSidebar };