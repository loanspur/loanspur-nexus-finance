import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";

const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/client/dashboard"
    },
    {
      title: "My Loans",
      path: "/client/loans"
    },
    {
      title: "My Savings",
      path: "/client/savings"
    },
    {
      title: "Payments",
      path: "/client/payments"
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-primary">LoanSpur CBS</h2>
          <p className="text-sm text-muted-foreground">Client Portal</p>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>My Account</SidebarGroupLabel>
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

export { ClientSidebar };