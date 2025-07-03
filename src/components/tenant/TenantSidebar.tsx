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
  Shield
} from "lucide-react";

const TenantSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/tenant/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics"
    },
    {
      title: "Clients",
      path: "/tenant/clients",
      icon: Users,
      description: "Client Management"
    },
    {
      title: "Loans",
      path: "/tenant/loans",
      icon: CreditCard,
      description: "Loan Portfolio"
    },
    {
      title: "Savings",
      path: "/tenant/savings",
      icon: PiggyBank,
      description: "Savings Accounts"
    },
    {
      title: "Transactions",
      path: "/tenant/transactions",
      icon: ArrowLeftRight,
      description: "Payment Processing"
    },
    {
      title: "Groups",
      path: "/tenant/groups",
      icon: Users2,
      description: "Group Banking"
    },
    {
      title: "Reports",
      path: "/tenant/reports",
      icon: TrendingUp,
      description: "Financial Reports"
    },
    {
      title: "Notifications",
      path: "/tenant/notifications",
      icon: Bell,
      description: "Communication Hub"
    },
    {
      title: "Documents",
      path: "/tenant/documents",
      icon: FileText,
      description: "Document Management"
    },
    {
      title: "Reconciliation",
      path: "/tenant/reconciliation",
      icon: RefreshCw,
      description: "Bank & MPESA Reconciliation"
    },
    {
      title: "Audit & Compliance",
      path: "/tenant/audit",
      icon: Shield,
      description: "Security & Compliance Monitoring"
    },
    {
      title: "Settings",
      path: "/tenant/settings",
      icon: Settings,
      description: "System Configuration"
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
        
        {/* Quick stats */}
        <div className="p-4 mx-4 mt-4 bg-gradient-primary rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Active Loans</p>
              <p className="text-xl font-bold">234</p>
            </div>
            <TrendingUp className="w-8 h-8 text-white/80" />
          </div>
        </div>
        
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6">
            Core Banking
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
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
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {item.description}
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
      </SidebarContent>
    </Sidebar>
  );
};

export { TenantSidebar };