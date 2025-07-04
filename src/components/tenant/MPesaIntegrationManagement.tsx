import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Settings, ArrowDown, ArrowUp } from "lucide-react";
import MPesaCredentialsForm from "@/components/forms/MPesaCredentialsForm";
import MPesaC2BForm from "@/components/forms/MPesaC2BForm";
import MPesaB2CForm from "@/components/forms/MPesaB2CForm";
import { useMPesaCredentials, useMPesaTransactions } from "@/hooks/useIntegrations";

interface MPesaIntegrationManagementProps {
  tenantId: string;
}

const MPesaIntegrationManagement = ({ tenantId }: MPesaIntegrationManagementProps) => {
  const [activeTab, setActiveTab] = useState("credentials");
  const { data: credentials } = useMPesaCredentials(tenantId);
  const { data: transactions } = useMPesaTransactions(tenantId);

  const hasActiveCredentials = credentials?.some((cred: any) => cred.is_active);
  
  const c2bTransactions = transactions?.filter((tx: any) => tx.transaction_type === 'c2b') || [];
  const b2cTransactions = transactions?.filter((tx: any) => tx.transaction_type === 'b2c') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">M-Pesa Integration</h2>
          <p className="text-muted-foreground">
            Manage M-Pesa API credentials and process C2B/B2C transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <Badge variant={hasActiveCredentials ? "default" : "secondary"}>
            {hasActiveCredentials ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credentials" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Credentials</span>
          </TabsTrigger>
          <TabsTrigger value="c2b" className="flex items-center space-x-2">
            <ArrowDown className="h-4 w-4" />
            <span>C2B Payments</span>
          </TabsTrigger>
          <TabsTrigger value="b2c" className="flex items-center space-x-2">
            <ArrowUp className="h-4 w-4" />
            <span>B2C Disbursements</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Transactions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <MPesaCredentialsForm tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="c2b" className="space-y-4">
          {!hasActiveCredentials ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Please configure your M-Pesa credentials first to enable C2B payments.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("credentials")}
                >
                  Configure Credentials
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <MPesaC2BForm tenantId={tenantId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent C2B Transactions</CardTitle>
                  <CardDescription>
                    Latest customer-to-business payment requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {c2bTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No C2B transactions yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {c2bTransactions.slice(0, 5).map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{tx.phone_number}</p>
                            <p className="text-sm text-muted-foreground">{tx.account_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">KES {tx.amount}</p>
                            <Badge variant={tx.reconciliation_status === 'matched' ? 'default' : 'secondary'}>
                              {tx.reconciliation_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="b2c" className="space-y-4">
          {!hasActiveCredentials ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Please configure your M-Pesa credentials first to enable B2C disbursements.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("credentials")}
                >
                  Configure Credentials
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <MPesaB2CForm tenantId={tenantId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent B2C Transactions</CardTitle>
                  <CardDescription>
                    Latest business-to-customer disbursements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {b2cTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No B2C transactions yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {b2cTransactions.slice(0, 5).map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{tx.phone_number}</p>
                            <p className="text-sm text-muted-foreground">{tx.account_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">KES {tx.amount}</p>
                            <Badge variant={tx.reconciliation_status === 'matched' ? 'default' : 'secondary'}>
                              {tx.reconciliation_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowDown className="h-5 w-5 text-green-600" />
                  <span>C2B Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c2bTransactions.length}</div>
                <p className="text-sm text-muted-foreground">Total incoming payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUp className="h-5 w-5 text-blue-600" />
                  <span>B2C Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{b2cTransactions.length}</div>
                <p className="text-sm text-muted-foreground">Total disbursements</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All M-Pesa Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions?.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {tx.transaction_type === 'c2b' ? (
                          <ArrowDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUp className="h-4 w-4 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">{tx.phone_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.account_reference} • {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KES {tx.amount}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {tx.transaction_type.toUpperCase()}
                          </Badge>
                          <Badge variant={tx.reconciliation_status === 'matched' ? 'default' : 'secondary'}>
                            {tx.reconciliation_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MPesaIntegrationManagement;