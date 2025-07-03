import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SavingsPage = () => {
  const savings = [
    {
      id: "SAV-001",
      clientName: "John Doe",
      accountType: "Regular Savings",
      balance: "$850",
      interestRate: "6%",
      status: "Active",
      openDate: "2024-01-15",
      lastTransaction: "2024-02-28",
      monthlyTarget: "$100"
    },
    {
      id: "SAV-002",
      clientName: "Jane Smith",
      accountType: "Fixed Deposit",
      balance: "$2,500",
      interestRate: "8%",
      status: "Active",
      openDate: "2024-01-20",
      lastTransaction: "2024-02-20",
      monthlyTarget: "$200"
    },
    {
      id: "SAV-003",
      clientName: "Mike Johnson",
      accountType: "Regular Savings",
      balance: "$150",
      interestRate: "6%",
      status: "Dormant",
      openDate: "2024-02-01",
      lastTransaction: "2024-02-01",
      monthlyTarget: "$50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Management</h1>
          <p className="text-muted-foreground">Monitor and manage savings accounts</p>
        </div>
        <Button>Open New Account</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">1,156</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$1.8M</div>
            <p className="text-xs text-muted-foreground">Total savings</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+8.5%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$1,557</div>
            <p className="text-xs text-muted-foreground">Per account</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Savings Accounts</CardTitle>
          <CardDescription>Complete overview of savings portfolio</CardDescription>
          <div className="flex gap-4">
            <Input placeholder="Search accounts..." className="max-w-sm" />
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savings.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-lg">{account.clientName}</div>
                  <div className="text-sm text-muted-foreground">ID: {account.id}</div>
                  <div className="text-sm text-muted-foreground">{account.accountType}</div>
                  <div className="text-xs text-muted-foreground">
                    Opened: {account.openDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">Balance: {account.balance}</div>
                    <div className="text-sm font-medium">Target: {account.monthlyTarget}/month</div>
                    <div className="text-xs text-muted-foreground">Rate: {account.interestRate}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Last transaction: {account.lastTransaction}
                    </div>
                  </div>
                  
                  <div>
                    <Badge 
                      variant={
                        account.status === 'Active' ? 'default' : 'secondary'
                      }
                    >
                      {account.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Deposit</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsPage;