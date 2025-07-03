import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ClientDashboard = () => {
  const accountSummary = {
    loanBalance: "$1,800",
    savingsBalance: "$850",
    nextPayment: "$250",
    nextPaymentDate: "2024-03-15",
    repaymentRate: "95%"
  };

  const recentTransactions = [
    { type: "Loan Payment", amount: "-$250", date: "2024-02-15", status: "Completed" },
    { type: "Savings Deposit", amount: "+$100", date: "2024-02-10", status: "Completed" },
    { type: "Loan Payment", amount: "-$250", date: "2024-01-15", status: "Completed" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground">Welcome to your LoanSpur client portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Loan Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{accountSummary.loanBalance}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Savings Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{accountSummary.savingsBalance}</div>
            <p className="text-xs text-muted-foreground">Total savings</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{accountSummary.nextPayment}</div>
            <p className="text-xs text-muted-foreground">Due: {accountSummary.nextPaymentDate}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Repayment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{accountSummary.repaymentRate}</div>
            <p className="text-xs text-muted-foreground">Timely payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Make Payment</div>
                  <div className="text-xs text-muted-foreground">Pay your loan via M-Pesa</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Deposit Savings</div>
                  <div className="text-xs text-muted-foreground">Add money to your savings</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Upload Documents</div>
                  <div className="text-xs text-muted-foreground">Submit required documents</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Download Statement</div>
                  <div className="text-xs text-muted-foreground">Get your account statement</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{transaction.type}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${transaction.amount.startsWith('+') ? 'text-success' : 'text-primary'}`}>
                      {transaction.amount}
                    </div>
                    <div className="text-xs text-muted-foreground">{transaction.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;