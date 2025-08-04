import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  PiggyBank, 
  ArrowLeftRight, 
  Users2, 
  Settings,
  Building2,
  TrendingUp,
  Bell,
  FileText,
  RefreshCw,
  Shield,
  Calculator
} from "lucide-react";

const TenantSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  

  const menuGroups = [
    {
      label: "Core Banking",
      items: [
        {
          title: "Dashboard",
          path: "/tenant/dashboard",
          icon: LayoutDashboard
        },
        {
          title: "Clients",
          path: "/tenant/clients", 
          icon: Users
        },
        {
          title: "Groups",
          path: "/tenant/groups",
          icon: Users2
        }
      ]
    },
    {
      label: "Operations",
      items: [
        {
          title: "M-Pesa Integration",
          path: "/tenant/mpesa",
          icon: CreditCard
        },
        {
          title: "Accounting",
          path: "/tenant/accounting",
          icon: Calculator
        },
        {
          title: "Reports",
          path: "/tenant/reports",
          icon: TrendingUp
        }
      ]
    },
    {
      label: "System Configuration",
      items: [
        {
          title: "User Management",
          path: "/tenant/user-management",
          icon: Users
        },
        {
          title: "Office Management",
          path: "/tenant/office-management",
          icon: Building2
        },
        {
          title: "Funds Management",
          path: "/tenant/funds-management",
          icon: PiggyBank
        },
        {
          title: "Product & Fee Management",
          path: "/tenant/product-fee-management",
          icon: TrendingUp
        },
        {
          title: "Audit Trail",
          path: "/tenant/audit-trail",
          icon: Shield
        },
        {
          title: "Schedule Jobs",
          path: "/tenant/schedule-jobs",
          icon: RefreshCw
        },
        {
          title: "Notifications",
          path: "/tenant/notifications",
          icon: Bell
        }
      ]
    }
  ];

  return (
    <Sidebar className="border-r-0 shadow-elevated">
      <SidebarContent className="bg-gradient-card">
        {/* Enhanced header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-primary">LoanSpur CBS</h2>
              <p className="text-xs text-muted-foreground">Tenant Portal</p>
            </div>
          </div>
        </div>
        
        
        {menuGroups.map((group) => {
          return (
            <SidebarGroup key={group.label} className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-4">
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          className={`
                            group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-card
                            ${isActive 
                              ? 'bg-gradient-primary text-white shadow-glow' 
                              : 'hover:bg-accent/50 hover:scale-105'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className={`
                              flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                              ${isActive 
                                ? 'bg-white/20' 
                                : 'bg-accent/30 group-hover:bg-accent/50'
                              }
                            `}>
                              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1 text-left">
                               <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-foreground'}`}>
                                 {item.title}
                               </p>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};

export { TenantSidebar };