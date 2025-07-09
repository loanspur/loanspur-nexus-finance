import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Eye, DollarSign, Percent, Calendar, CreditCard, PiggyBank, TrendingUp, Settings } from "lucide-react";
import { format } from "date-fns";

export const ProductDetailsView = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productType, setProductType] = useState<'loan' | 'savings'>('loan');
  const { profile } = useAuth();

  // Fetch loan products
  const { data: loanProducts = [], isLoading: isLoadingLoans } = useQuery({
    queryKey: ['loan-products-details', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch savings products
  const { data: savingsProducts = [], isLoading: isLoadingSavings } = useQuery({
    queryKey: ['savings-products-details', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('savings_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const isLoading = isLoadingLoans || isLoadingSavings;

  const ProductDetailDialog = ({ product, type }: { product: any, type: 'loan' | 'savings' }) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {type === 'loan' ? <TrendingUp className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
          {product.name} - Product Details
        </DialogTitle>
        <DialogDescription>
          Comprehensive details for this {type} product
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Short Name</label>
                <p className="text-lg font-semibold">{product.short_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <Badge variant="outline">{product.currency_code}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            {product.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{format(new Date(product.created_at), 'PPP')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{format(new Date(product.updated_at), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Terms</CardTitle>
          </CardHeader>
          <CardContent>
            {type === 'loan' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Principal Range</label>
                  <p className="text-sm">{product.currency_code} {Number(product.min_principal || 0).toLocaleString()} - {Number(product.max_principal || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interest Rate Range</label>
                  <p className="text-sm">{product.min_nominal_interest_rate}% - {product.max_nominal_interest_rate}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Term Range</label>
                  <p className="text-sm">{product.min_term} - {product.max_term} months</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Repayment Frequency</label>
                  <p className="text-sm capitalize">{product.repayment_frequency}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interest Rate</label>
                  <p className="text-sm font-semibold">{product.nominal_annual_interest_rate}% per annum</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Opening Balance</label>
                  <p className="text-sm">{product.currency_code} {Number(product.min_required_opening_balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Balance for Interest</label>
                  <p className="text-sm">{product.currency_code} {Number(product.min_balance_for_interest_calculation || 0).toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounting Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accounting Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Accounting Method</label>
                <p className="text-sm capitalize">{product.accounting_method?.replace('_', ' ')}</p>
              </div>
              {type === 'loan' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fund Type</label>
                    <p className="text-sm capitalize">{product.fund_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amortization Method</label>
                    <p className="text-sm capitalize">{product.amortization_method?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Interest Calculation</label>
                    <p className="text-sm capitalize">{product.interest_calculation_method?.replace('_', ' ')}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Details</h2>
          <p className="text-muted-foreground">View comprehensive details of all your products</p>
        </div>
      </div>

      <Tabs defaultValue="loan-products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="loan-products" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Loan Products
          </TabsTrigger>
          <TabsTrigger value="savings-products" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loan-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Products Overview</CardTitle>
              <CardDescription>
                Detailed view of all loan products and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loanProducts.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No loan products found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Interest Rate Range</TableHead>
                      <TableHead>Principal Range</TableHead>
                      <TableHead>Term Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.short_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>{product.min_nominal_interest_rate}% - {product.max_nominal_interest_rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{product.currency_code} {Number(product.min_principal || 0).toLocaleString()} - {Number(product.max_principal || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{product.min_term} - {product.max_term} months</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <ProductDetailDialog product={product} type="loan" />
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Savings Products Overview</CardTitle>
              <CardDescription>
                Detailed view of all savings products and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savingsProducts.length === 0 ? (
                <div className="text-center py-8">
                  <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No savings products found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Min Opening Balance</TableHead>
                      <TableHead>Min Balance for Interest</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingsProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.short_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>{product.nominal_annual_interest_rate}% p.a.</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{product.currency_code} {Number(product.min_required_opening_balance || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{product.currency_code} {Number(product.min_balance_for_interest_calculation || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <ProductDetailDialog product={product} type="savings" />
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};