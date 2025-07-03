import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BillingPage = () => {
  const billingData = [
    {
      tenant: "ABC Microfinance",
      plan: "Professional",
      amount: "$99",
      status: "Paid",
      dueDate: "2024-03-15",
      invoiceId: "INV-001"
    },
    {
      tenant: "XYZ SACCO",
      plan: "Enterprise",
      amount: "$299",
      status: "Pending",
      dueDate: "2024-03-20",
      invoiceId: "INV-002"
    },
    {
      tenant: "Community Bank",
      plan: "Professional",
      amount: "$99",
      status: "Paid",
      dueDate: "2024-03-10",
      invoiceId: "INV-003"
    }
  ];

  const revenueStats = [
    { title: "Monthly Revenue", value: "$8,450", change: "+12%" },
    { title: "Annual Recurring Revenue", value: "$101,400", change: "+18%" },
    { title: "Outstanding Invoices", value: "$299", change: "-5%" },
    { title: "Churn Rate", value: "2.1%", change: "-0.5%" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Revenue</h1>
        <p className="text-muted-foreground">Monitor payments and revenue metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, index) => (
          <Card key={index} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <p className="text-xs text-success">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.map((billing, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{billing.tenant}</div>
                  <div className="text-sm text-muted-foreground">
                    Invoice: {billing.invoiceId} • Due: {billing.dueDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{billing.amount}</div>
                    <div className="text-xs text-muted-foreground">{billing.plan}</div>
                  </div>
                  
                  <Badge 
                    variant={billing.status === 'Paid' ? 'default' : 'secondary'}
                  >
                    {billing.status}
                  </Badge>
                  
                  <Button variant="outline" size="sm">
                    View Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;