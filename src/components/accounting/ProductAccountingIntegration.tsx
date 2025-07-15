import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  DollarSign, 
  TrendingUp,
  FileText,
  Plus
} from "lucide-react";
import { useProductAccountingSetup, useValidateProductAccounting, useCreateProductJournalEntry } from "@/hooks/useProductAccounting";

export const ProductAccountingIntegration = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: productSetup = [], isLoading } = useProductAccountingSetup();
  const { data: validation } = useValidateProductAccounting();
  const createProductJournalEntry = useCreateProductJournalEntry();

  const handleTestTransaction = async (productId: string, productType: 'loan' | 'savings' | 'fee') => {
    try {
      await createProductJournalEntry.mutateAsync({
        product_id: productId,
        product_type: productType,
        transaction_type: 'disbursement',
        amount: 1000,
        description: 'Test transaction for accounting integration',
        auto_post: false,
      });
    } catch (error) {
      console.error('Failed to create test transaction:', error);
    }
  };

  const getStatusIcon = (hasCompleteSetup: boolean, isEnabled: boolean) => {
    if (hasCompleteSetup && isEnabled) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    } else if (isEnabled) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  const getStatusBadge = (hasCompleteSetup: boolean, isEnabled: boolean) => {
    if (hasCompleteSetup && isEnabled) {
      return <Badge variant="default" className="bg-success">Complete</Badge>;
    } else if (isEnabled) {
      return <Badge variant="secondary" className="bg-warning">Incomplete</Badge>;
    }
    return <Badge variant="destructive">Not Configured</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading product accounting setup...</p>
      </div>
    );
  }

  const loanProducts = productSetup.filter(p => p.product_type === 'loan');
  const savingsProducts = productSetup.filter(p => p.product_type === 'savings');
  const feeStructures = productSetup.filter(p => p.product_type === 'fee');

  const completeLoanProducts = loanProducts.filter(p => p.has_complete_setup && p.is_accounting_enabled);
  const incompleteLoanProducts = loanProducts.filter(p => !p.has_complete_setup || !p.is_accounting_enabled);

  return (
    <div className="space-y-6">
      {/* Validation Alert */}
      {validation && !validation.isValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Accounting Setup Issues Found:</p>
              {validation.issues.map((issue, index) => (
                <p key={index} className="text-sm">• {issue}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productSetup.length}</div>
            <p className="text-xs text-muted-foreground">All product types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete Setup</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completeLoanProducts.length}</div>
            <p className="text-xs text-muted-foreground">Ready for accounting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Setup</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{incompleteLoanProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need configuration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completeLoanProducts.length / Math.max(loanProducts.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Integration coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Integration Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loan-products">Loan Products ({loanProducts.length})</TabsTrigger>
          <TabsTrigger value="other-products">Other Products ({savingsProducts.length + feeStructures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status Summary</CardTitle>
              <CardDescription>
                Overview of accounting integration for all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{loanProducts.length}</div>
                    <p className="text-sm text-muted-foreground">Loan Products</p>
                    <p className="text-xs">
                      {completeLoanProducts.length} complete, {incompleteLoanProducts.length} incomplete
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{savingsProducts.length}</div>
                    <p className="text-sm text-muted-foreground">Savings Products</p>
                    <p className="text-xs">Integration coming soon</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-accent">{feeStructures.length}</div>
                    <p className="text-sm text-muted-foreground">Fee Structures</p>
                    <p className="text-xs">Integration coming soon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Products Accounting Integration</CardTitle>
              <CardDescription>
                Manage accounting setup for loan products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loanProducts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No loan products found</p>
                  <p className="text-sm text-muted-foreground">Create loan products to see accounting integration</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accounting Type</TableHead>
                      <TableHead>Portfolio Account</TableHead>
                      <TableHead>Interest Account</TableHead>
                      <TableHead>Fund Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(product.has_complete_setup, product.is_accounting_enabled)}
                            <span className="font-medium">{product.product_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.has_complete_setup, product.is_accounting_enabled)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.is_accounting_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.accounting_accounts.loan_portfolio_account_id ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {product.accounting_accounts.interest_income_account_id ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {product.accounting_accounts.fund_source_account_id ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestTransaction(product.product_id, 'loan')}
                              disabled={!product.has_complete_setup || createProductJournalEntry.isPending}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Test Entry
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Products</CardTitle>
              <CardDescription>
                Savings products and fee structures accounting integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Savings Products */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Savings Products ({savingsProducts.length})</h4>
                  {savingsProducts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No savings products found</p>
                  ) : (
                    <div className="space-y-2">
                      {savingsProducts.map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{product.product_name}</span>
                          <Badge variant="secondary">Integration Coming Soon</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fee Structures */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Fee Structures ({feeStructures.length})</h4>
                  {feeStructures.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No fee structures found</p>
                  ) : (
                    <div className="space-y-2">
                      {feeStructures.map((product) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{product.product_name}</span>
                          <Badge variant="secondary">Integration Coming Soon</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};