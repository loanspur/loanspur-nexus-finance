import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ClientLoansPage = () => {
  const currentLoan = {
    id: "LON-001",
    principal: "$2,500",
    balance: "$1,800",
    interestRate: "12%",
    status: "Active",
    disbursementDate: "2024-01-15",
    maturityDate: "2025-01-15",
    nextPayment: "$250",
    nextPaymentDate: "2024-03-15",
    totalPaid: "$700",
    monthlyPayment: "$250"
  };

  const paymentHistory = [
    { date: "2024-02-15", amount: "$250", principal: "$200", interest: "$50", balance: "$1,800" },
    { date: "2024-01-15", amount: "$250", principal: "$180", interest: "$70", balance: "$2,000" },
    { date: "2023-12-15", amount: "$250", principal: "$170", interest: "$80", balance: "$2,180" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Loans</h1>
        <p className="text-muted-foreground">View and manage your loan accounts</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Current Loan</CardTitle>
              <CardDescription>Loan ID: {currentLoan.id}</CardDescription>
            </div>
            <Badge variant="default">{currentLoan.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Principal Amount</div>
                <div className="text-2xl font-bold text-primary">{currentLoan.principal}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                <div className="text-2xl font-bold text-primary">{currentLoan.balance}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Interest Rate</div>
                <div className="text-lg font-medium">{currentLoan.interestRate}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Monthly Payment</div>
                <div className="text-lg font-medium">{currentLoan.monthlyPayment}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Next Payment</div>
                <div className="text-lg font-bold text-warning">{currentLoan.nextPayment}</div>
                <div className="text-sm text-muted-foreground">Due: {currentLoan.nextPaymentDate}</div>
              </div>
              <Button className="w-full">
                Make Payment
              </Button>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Disbursement Date:</span>
                <span className="ml-2 font-medium">{currentLoan.disbursementDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Maturity Date:</span>
                <span className="ml-2 font-medium">{currentLoan.maturityDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="ml-2 font-medium text-success">{currentLoan.totalPaid}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Record of all your loan payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentHistory.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">Payment #{paymentHistory.length - index}</div>
                  <div className="text-sm text-muted-foreground">{payment.date}</div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{payment.amount}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium">{payment.principal}</div>
                    <div className="text-xs text-muted-foreground">Principal</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium">{payment.interest}</div>
                    <div className="text-xs text-muted-foreground">Interest</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium">{payment.balance}</div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">Download Full Statement</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLoansPage;