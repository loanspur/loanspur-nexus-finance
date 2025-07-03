import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TenantDashboard = () => {
  const stats = [
    {
      title: "Total Clients",
      value: "1,247",
      description: "+12% from last month",
      category: "clients"
    },
    {
      title: "Active Loans",
      value: "892",
      description: "Total outstanding",
      category: "loans"
    },
    {
      title: "Savings Accounts",
      value: "1,156",
      description: "Total active accounts",
      category: "savings"
    },
    {
      title: "Active Groups",
      value: "34",
      description: "Community groups",
      category: "groups"
    }
  ];

  const recentActivities = [
    { type: "loan", description: "New loan application from John Doe", time: "2 hours ago" },
    { type: "payment", description: "Payment received from Jane Smith", time: "4 hours ago" },
    { type: "client", description: "New client registration: Mike Johnson", time: "6 hours ago" },
    { type: "group", description: "New group created: Village Savings", time: "1 day ago" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your LoanSpur CBS tenant portal</p>
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
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest activities in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.description}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-sm font-medium">Add Client</div>
                <div className="text-xs text-muted-foreground">Register new client</div>
              </Card>
              <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-sm font-medium">Process Loan</div>
                <div className="text-xs text-muted-foreground">New loan application</div>
              </Card>
              <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-sm font-medium">Record Payment</div>
                <div className="text-xs text-muted-foreground">Log payment received</div>
              </Card>
              <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-sm font-medium">View Reports</div>
                <div className="text-xs text-muted-foreground">Generate reports</div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantDashboard;