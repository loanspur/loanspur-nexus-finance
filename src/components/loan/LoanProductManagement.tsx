import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoanProductForm } from "@/components/forms/LoanProductForm";
import { FundSourcesConfigDialog } from "@/components/forms/FundSourcesConfigDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Edit, Plus, ToggleLeft, ToggleRight, DollarSign, Percent, Calendar, Settings } from "lucide-react";

export const LoanProductManagement = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [fundSourcesOpen, setFundSourcesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { profile } = useAuth();

  // Fetch loan products
  const { data: loanProducts = [], isLoading } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading loan products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loan Products</h2>
          <p className="text-muted-foreground">Manage your loan product offerings</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Loan Product</DialogTitle>
              <DialogDescription>
                Define a new loan product with specific terms and conditions
              </DialogDescription>
            </DialogHeader>
             <LoanProductForm 
               open={formOpen} 
               onOpenChange={(open) => {
                 setFormOpen(open);
                 if (!open) setEditingProduct(null);
               }}
               tenantId={profile?.tenant_id || ''} 
               editingProduct={editingProduct}
             />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{loanProducts.length}</div>
            <p className="text-xs text-muted-foreground">Available products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ToggleRight className="w-4 h-4" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {loanProducts.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Avg Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loanProducts.length > 0 
                ? (loanProducts.reduce((sum, p) => sum + p.default_nominal_interest_rate, 0) / loanProducts.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Loan Products</CardTitle>
          <CardDescription>
            Complete list of your loan product offerings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loanProducts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No loan products found</p>
              <p className="text-sm text-muted-foreground">Create your first loan product to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Principal Range</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Currency</TableHead>
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
                      <div className="text-sm text-muted-foreground">
                        Default: {product.default_nominal_interest_rate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${product.min_principal?.toLocaleString()} - ${product.max_principal?.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Default: ${product.default_principal?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{product.min_term} - {product.max_term} months</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Default: {product.default_term} months
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.currency_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                              setEditingProduct(product);
                              setFormOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedProduct(product);
                              setFundSourcesOpen(true);
                            }}
                          >
                            <Settings className="w-3 h-3" />
                            Fund Sources
                          </Button>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="flex items-center gap-1"
                         >
                           {product.is_active ? (
                             <>
                               <ToggleLeft className="w-3 h-3" />
                               Disable
                             </>
                           ) : (
                             <>
                               <ToggleRight className="w-3 h-3" />
                               Enable
                             </>
                           )}
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

      {/* Fund Sources Configuration Dialog */}
      {selectedProduct && (
        <FundSourcesConfigDialog
          open={fundSourcesOpen}
          onOpenChange={setFundSourcesOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productType="loan"
        />
      )}
    </div>
  );
};