import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const LoansPage = () => {
  const loans = [
    {
      id: "LON-001",
      clientName: "John Doe",
      principal: "$2,500",
      balance: "$1,800",
      interestRate: "12%",
      status: "Active",
      disbursementDate: "2024-01-15",
      nextPayment: "2024-03-15",
      nextAmount: "$250",
      guarantors: ["Jane Smith", "Mike Johnson"]
    },
    {
      id: "LON-002",
      clientName: "Jane Smith", 
      principal: "$1,200",
      balance: "$900",
      interestRate: "10%",
      status: "Overdue",
      disbursementDate: "2024-02-10",
      nextPayment: "2024-02-28",
      nextAmount: "$150",
      guarantors: ["John Doe"]
    },
    {
      id: "LON-003",
      clientName: "Alice Brown",
      principal: "$3,000",
      balance: "$3,000",
      interestRate: "15%",
      status: "Pending",
      disbursementDate: "Pending",
      nextPayment: "N/A",
      nextAmount: "N/A",
      guarantors: ["Bob Wilson", "Carol Davis"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loan Management</h1>
          <p className="text-muted-foreground">Track and manage all loan accounts</p>
        </div>
        <Button>New Loan Application</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">892</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$2.4M</div>
            <p className="text-xs text-muted-foreground">Total balance</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">42</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">94.2%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>Complete overview of loan portfolio</CardDescription>
          <div className="flex gap-4">
            <Input placeholder="Search loans..." className="max-w-sm" />
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-lg">{loan.clientName}</div>
                  <div className="text-sm text-muted-foreground">ID: {loan.id}</div>
                  <div className="text-sm text-muted-foreground">
                    Guarantors: {loan.guarantors.join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Disbursed: {loan.disbursementDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">Principal: {loan.principal}</div>
                    <div className="text-sm font-medium">Balance: {loan.balance}</div>
                    <div className="text-xs text-muted-foreground">Rate: {loan.interestRate}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">Next: {loan.nextAmount}</div>
                    <div className="text-xs text-muted-foreground">Due: {loan.nextPayment}</div>
                  </div>
                  
                  <div>
                    <Badge 
                      variant={
                        loan.status === 'Active' ? 'default' : 
                        loan.status === 'Overdue' ? 'destructive' : 'secondary'
                      }
                    >
                      {loan.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Payment</Button>
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

export default LoansPage;