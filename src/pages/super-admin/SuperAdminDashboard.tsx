import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SuperAdminDashboard = () => {
  const stats = [
    {
      title: "Active Tenants",
      value: "24",
      description: "Growing 12% this month",
      trend: "up"
    },
    {
      title: "Total Revenue",
      value: "$8,450",
      description: "Monthly recurring revenue",
      trend: "up"
    },
    {
      title: "Total Clients",
      value: "12,847",
      description: "Across all tenants",
      trend: "up"
    },
    {
      title: "System Health",
      value: "99.9%",
      description: "Uptime this month",
      trend: "stable"
    }
  ];

  const recentTenants = [
    { name: "ABC Microfinance", plan: "Professional", status: "Active", clients: 450 },
    { name: "XYZ SACCO", plan: "Enterprise", status: "Trial", clients: 1200 },
    { name: "Community Bank", plan: "Professional", status: "Active", clients: 850 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your LoanSpur CBS platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
            <CardDescription>Latest organizations to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenants.map((tenant, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground">{tenant.clients} clients</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{tenant.plan}</Badge>
                    <Badge 
                      variant={tenant.status === 'Active' ? 'default' : 'secondary'}
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Conversion Rate (Trial → Paid)</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Revenue Per Tenant</span>
                <span className="font-medium">$352/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Support Tickets (Open)</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API Calls (Last 24h)</span>
                <span className="font-medium">124,891</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;