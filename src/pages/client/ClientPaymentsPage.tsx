import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const ClientPaymentsPage = () => {
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const paymentMethods = [
    { name: "M-Pesa", description: "Pay directly from your mobile money", available: true },
    { name: "Bank Transfer", description: "Transfer from your bank account", available: true },
    { name: "Cash Deposit", description: "Visit our office to make payment", available: true }
  ];

  const recentPayments = [
    { date: "2024-02-15", amount: "$250", type: "Loan Payment", method: "M-Pesa", status: "Completed", reference: "MPX123456" },
    { date: "2024-02-10", amount: "$100", type: "Savings Deposit", method: "M-Pesa", status: "Completed", reference: "MPX123457" },
    { date: "2024-01-15", amount: "$250", type: "Loan Payment", method: "Bank Transfer", status: "Completed", reference: "BT789012" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Make payments and view your transaction history</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
          <CardDescription>Choose what you'd like to pay for</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="loan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loan">Loan Payment</TabsTrigger>
              <TabsTrigger value="savings">Savings Deposit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="loan" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loan-amount">Payment Amount</Label>
                  <Input
                    id="loan-amount"
                    type="number"
                    placeholder="Enter amount (e.g., 250)"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Next payment due: $250 on 2024-03-15
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label>Payment Method</Label>
                  {paymentMethods.map((method, index) => (
                    <Card key={index} className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${!method.available ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">{method.description}</div>
                        </div>
                        {method.available && (
                          <Button size="sm">Select</Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="savings" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="savings-amount">Deposit Amount</Label>
                  <Input
                    id="savings-amount"
                    type="number"
                    placeholder="Enter amount (e.g., 100)"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Monthly target: $100 (Current: $150 this month)
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label>Deposit Method</Label>
                  {paymentMethods.map((method, index) => (
                    <Card key={index} className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${!method.available ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">{method.description}</div>
                        </div>
                        {method.available && (
                          <Button size="sm">Select</Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{payment.type}</div>
                  <div className="text-sm text-muted-foreground">{payment.date}</div>
                  <div className="text-xs text-muted-foreground">Ref: {payment.reference}</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium text-success">{payment.amount}</div>
                    <div className="text-sm text-muted-foreground">{payment.method}</div>
                  </div>
                  
                  <Badge variant="default">
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">View All Transactions</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
          <CardDescription>How to make payments using different methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">M-Pesa Payment</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Go to M-Pesa menu on your phone</li>
                <li>Select "Lipa na M-Pesa" then "Pay Bill"</li>
                <li>Enter Business Number: 174379</li>
                <li>Enter your Client ID as Account Number</li>
                <li>Enter amount and complete transaction</li>
              </ol>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bank Transfer</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Bank: ABC Bank</div>
                <div>Account: 1234567890</div>
                <div>Reference: Your Client ID</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPaymentsPage;