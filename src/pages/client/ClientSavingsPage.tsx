import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ClientSavingsPage = () => {
  const savingsAccount = {
    id: "SAV-001",
    accountType: "Regular Savings",
    balance: "$850",
    interestRate: "6%",
    status: "Active",
    openDate: "2024-01-15",
    monthlyTarget: "$100",
    thisMonthDeposits: "$150",
    totalDeposits: "$900",
    interestEarned: "$12.50"
  };

  const transactionHistory = [
    { date: "2024-02-28", type: "Deposit", amount: "+$50", method: "M-Pesa", balance: "$850" },
    { date: "2024-02-15", type: "Deposit", amount: "+$100", method: "Cash", balance: "$800" },
    { date: "2024-01-30", type: "Interest", amount: "+$4.50", method: "Auto", balance: "$700" },
    { date: "2024-01-15", type: "Deposit", amount: "+$150", method: "M-Pesa", balance: "$695.50" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Savings</h1>
        <p className="text-muted-foreground">View and manage your savings accounts</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Savings Account</CardTitle>
              <CardDescription>Account ID: {savingsAccount.id} • {savingsAccount.accountType}</CardDescription>
            </div>
            <Badge variant="default">{savingsAccount.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-3xl font-bold text-success">{savingsAccount.balance}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Interest Rate</div>
                <div className="text-lg font-medium">{savingsAccount.interestRate} per annum</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Monthly Target</div>
                <div className="text-lg font-medium">{savingsAccount.monthlyTarget}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">This Month's Deposits</div>
                <div className="text-lg font-medium text-success">{savingsAccount.thisMonthDeposits}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Deposits</div>
                <div className="text-lg font-medium">{savingsAccount.totalDeposits}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Interest Earned</div>
                <div className="text-lg font-medium text-success">{savingsAccount.interestEarned}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1">
                Deposit via M-Pesa
              </Button>
              <Button variant="outline" className="flex-1">
                Schedule Auto-Deposit
              </Button>
              <Button variant="outline" className="flex-1">
                Download Statement
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Account opened: {savingsAccount.openDate}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Record of all your savings transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactionHistory.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{transaction.type}</div>
                  <div className="text-sm text-muted-foreground">{transaction.date}</div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-success">{transaction.amount}</div>
                    <div className="text-xs text-muted-foreground">{transaction.method}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium">{transaction.balance}</div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">Load More Transactions</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Savings Goal Tracking</CardTitle>
          <CardDescription>Monitor your progress towards your savings targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Monthly Target Progress</span>
              <span className="text-sm font-medium">150% completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-success h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-xs text-muted-foreground">
              You've exceeded your monthly target by $50! Keep up the great work.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSavingsPage;