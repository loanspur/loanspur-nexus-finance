import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, PiggyBank, RefreshCw, Settings } from "lucide-react";
import { LoanProductManagement } from "@/components/loan/LoanProductManagement";
import { SavingsProductManagement } from "@/components/savings/SavingsProductManagement";
import { FeeStructureManagement } from "@/components/fees/FeeStructureManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProductFeeManagementPage = () => {
  const { profile } = useAuth();

  // Fetch loan products for summary
  const { data: loanProducts = [] } = useQuery({
    queryKey: ['loan-products-summary', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch savings products for summary
  const { data: savingsProducts = [] } = useQuery({
    queryKey: ['savings-products-summary', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('savings_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const isLoading = !profile?.tenant_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product & Fee Management</h1>
          <p className="text-muted-foreground">Manage loan products and savings products</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loanProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              {loanProducts.filter(p => p.is_active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Products</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              {savingsProducts.filter(p => p.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loanProducts.length + savingsProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              All products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Interest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loanProducts.length > 0 
                ? `${(loanProducts.reduce((sum, p) => sum + (p.default_nominal_interest_rate || 0), 0) / loanProducts.length).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Loan products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Type Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Product Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loanProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No loan products configured</p>
              ) : (
                loanProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.short_name}</Badge>
                      <span className="text-sm">{product.name}</span>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Product Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savingsProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No savings products configured</p>
              ) : (
                savingsProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.short_name}</Badge>
                      <span className="text-sm">{product.name}</span>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="loan-products" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="loan-products" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Loan Products
          </TabsTrigger>
          <TabsTrigger value="savings-products" className="flex-1">
            <PiggyBank className="h-4 w-4 mr-2" />  
            Savings Products
          </TabsTrigger>
          <TabsTrigger value="fee-management" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Fee Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loan-products" className="space-y-4">
          <LoanProductManagement />
        </TabsContent>

        <TabsContent value="savings-products" className="space-y-4">
          <SavingsProductManagement />
        </TabsContent>

        <TabsContent value="fee-management" className="space-y-4">
          <FeeStructureManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductFeeManagementPage;