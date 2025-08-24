import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SavingsProduct } from '@/types/savings';

export function SavingsProductManagement() {
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavingsProducts();
  }, []);

  const loadSavingsProducts = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to load savings products
      const mockProducts: SavingsProduct[] = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          name: 'Basic Savings Account',
          short_name: 'BSA',
          description: 'Standard savings account with competitive interest rates',
          product_type: 'savings',
          min_balance: 1000,
          interest_rate: 5.5,
          interest_calculation_period: 'monthly',
          interest_posting_period: 'monthly',
          allow_overdraft: false,
          allow_withdrawals: true,
          allow_deposits: true,
          allow_transfers: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          tenant_id: 'tenant-1',
          name: 'Fixed Deposit Account',
          short_name: 'FDA',
          description: 'High-yield fixed deposit with guaranteed returns',
          product_type: 'fixed_deposit',
          min_balance: 50000,
          interest_rate: 8.5,
          interest_calculation_period: 'monthly',
          interest_posting_period: 'at_maturity',
          min_deposit_amount: 50000,
          max_deposit_amount: 10000000,
          min_deposit_term: 3,
          max_deposit_term: 60,
          early_withdrawal_penalty: 2.0,
          allow_overdraft: false,
          allow_withdrawals: false,
          allow_deposits: false,
          allow_transfers: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setProducts(mockProducts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load savings products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeBadge = (type: string) => {
    const variants = {
      savings: 'default',
      fixed_deposit: 'secondary',
      recurring_deposit: 'outline',
      goal_savings: 'destructive',
    };
    return <Badge variant={variants[type as keyof typeof variants]}>{type.replace('_', ' ')}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline',
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  if (loading) {
    return <div>Loading savings products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Savings Products</h2>
        <Button>Create New Product</Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="fixed_deposit">Fixed Deposits</TabsTrigger>
          <TabsTrigger value="goal_savings">Goal Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.short_name}</p>
                    </div>
                    {getProductTypeBadge(product.product_type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Interest Rate:</span>
                        <span className="ml-1 text-green-600">{product.interest_rate}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Min Balance:</span>
                        <span className="ml-1">{product.min_balance.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      {getStatusBadge(product.status)}
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}