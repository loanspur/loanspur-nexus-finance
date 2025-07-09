import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SavingsProductForm } from "@/components/forms/SavingsProductForm";
import { FundSourcesConfigDialog } from "@/components/forms/FundSourcesConfigDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateSavingsProduct } from '@/hooks/useSupabase';
import { Edit, Plus, ToggleLeft, ToggleRight, DollarSign, Percent, PiggyBank, Settings } from "lucide-react";

export const SavingsProductManagement = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [fundSourcesOpen, setFundSourcesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { profile } = useAuth();
  const { mutate: updateSavingsProduct } = useUpdateSavingsProduct();

  // Fetch savings products
  const { data: savingsProducts = [], isLoading } = useQuery({
    queryKey: ['savings-products', profile?.tenant_id],
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading savings products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Savings Products</h2>
          <p className="text-muted-foreground">Manage your savings product offerings</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Savings Product" : "Create Savings Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Update the savings product details and configuration"
                  : "Define a new savings product with specific terms and interest rates"
                }
              </DialogDescription>
            </DialogHeader>
            <SavingsProductForm 
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
              <PiggyBank className="w-4 h-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{savingsProducts.length}</div>
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
              {savingsProducts.filter(p => p.is_active).length}
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
              {savingsProducts.length > 0 
                ? (savingsProducts.reduce((sum, p) => sum + p.nominal_annual_interest_rate, 0) / savingsProducts.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Savings Products</CardTitle>
          <CardDescription>
            Complete list of your savings product offerings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savingsProducts.length === 0 ? (
            <div className="text-center py-8">
              <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No savings products found</p>
              <p className="text-sm text-muted-foreground">Create your first savings product to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Min Opening Balance</TableHead>
                  <TableHead>Min Balance for Interest</TableHead>
                  <TableHead>Currency</TableHead>
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
                        <span>{product.currency_code} {product.min_required_opening_balance?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{product.currency_code} {product.min_balance_for_interest_calculation?.toLocaleString()}</span>
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
                          onClick={() => updateSavingsProduct({ 
                            id: product.id, 
                            is_active: !product.is_active 
                          })}
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
          productType="savings"
        />
      )}
    </div>
  );
};