import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateSavingsAccount, useClients, useSavingsProducts } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const savingsAccountSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  savings_product_id: z.string().min(1, "Savings product is required"),
  account_number: z.string().min(1, "Account number is required"),
  account_balance: z.number().min(0, "Account balance must be positive"),
  available_balance: z.number().min(0, "Available balance must be positive"),
  is_active: z.boolean().default(true),
  opened_date: z.string().min(1, "Opening date is required"),
});

type SavingsAccountFormValues = z.infer<typeof savingsAccountSchema>;

interface SavingsAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: any | null;
}

export const SavingsAccountForm = ({ open, onOpenChange, editingAccount }: SavingsAccountFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const createSavingsAccount = useCreateSavingsAccount();
  const { data: clients = [] } = useClients();
  const { data: savingsProducts = [] } = useSavingsProducts();

  const form = useForm<SavingsAccountFormValues>({
    resolver: zodResolver(savingsAccountSchema),
    defaultValues: editingAccount ? {
      client_id: editingAccount.client_id,
      savings_product_id: editingAccount.savings_product_id,
      account_number: editingAccount.account_number,
      account_balance: editingAccount.account_balance,
      available_balance: editingAccount.available_balance,
      is_active: editingAccount.is_active,
      opened_date: editingAccount.opened_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    } : {
      client_id: "",
      savings_product_id: "",
      account_number: "",
      account_balance: 0,
      available_balance: 0,
      is_active: true,
      opened_date: new Date().toISOString().split('T')[0],
    },
  });

  // Generate account number when product is selected
  const generateAccountNumber = (productId: string) => {
    const product = savingsProducts.find(p => p.id === productId);
    if (product) {
      const timestamp = Date.now().toString().slice(-6);
      const productCode = product.short_name.substring(0, 3).toUpperCase();
      return `${productCode}-${timestamp}`;
    }
    return "";
  };

  const onSubmit = async (values: SavingsAccountFormValues) => {
    if (!profile?.tenant_id) return;
    
    setIsSubmitting(true);
    try {
      await createSavingsAccount.mutateAsync({
        tenant_id: profile.tenant_id,
        client_id: values.client_id,
        savings_product_id: values.savings_product_id,
        account_number: values.account_number,
        account_balance: values.account_balance,
        available_balance: values.available_balance,
        interest_earned: 0,
        is_active: values.is_active,
        opened_date: values.opened_date,
        mifos_account_id: null,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating savings account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{editingAccount ? 'Edit Savings Account' : 'Open Savings Account'}</CardTitle>
        <CardDescription>
          {editingAccount ? 'Update savings account details' : 'Create a new savings account for a client'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client and Product Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} - {client.client_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="savings_product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Product</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-generate account number
                        const accountNumber = generateAccountNumber(value);
                        form.setValue("account_number", accountNumber);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select savings product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {savingsProducts
                          .filter(product => product.is_active)
                          .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.nominal_annual_interest_rate}% p.a.
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SAV-123456" {...field} />
                    </FormControl>
                    <FormDescription>
                      Auto-generated when product is selected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opened_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Balance Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Deposit</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="100.00"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          // Set available balance to same as account balance initially
                          form.setValue("available_balance", value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Initial deposit amount for the account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Balance</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="100.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Available balance for withdrawals
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Account</FormLabel>
                    <FormDescription>
                      Enable transactions on this account
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAccount ? 'Update Account' : 'Open Account'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};