import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, CreditCard, Smartphone } from "lucide-react";
import { useInitiateC2BPayment } from "@/hooks/useIntegrations";

const c2bPaymentSchema = z.object({
  phone_number: z.string().min(10, "Valid phone number is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  account_reference: z.string().min(1, "Account reference is required"),
  transaction_desc: z.string().min(1, "Transaction description is required"),
  client_id: z.string().optional(),
  loan_id: z.string().optional(),
  savings_account_id: z.string().optional(),
});

type C2BPaymentForm = z.infer<typeof c2bPaymentSchema>;

interface MPesaC2BFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

const MPesaC2BForm = ({ tenantId, onSuccess }: MPesaC2BFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const initiatePayment = useInitiateC2BPayment();

  const form = useForm<C2BPaymentForm>({
    resolver: zodResolver(c2bPaymentSchema),
    defaultValues: {
      phone_number: '',
      amount: 0,
      account_reference: '',
      transaction_desc: '',
      client_id: '',
      loan_id: '',
      savings_account_id: '',
    },
  });

  const onSubmit = async (data: C2BPaymentForm) => {
    try {
      await initiatePayment.mutateAsync({
        phone_number: data.phone_number,
        amount: data.amount,
        account_reference: data.account_reference,
        transaction_desc: data.transaction_desc,
        tenant_id: tenantId,
        client_id: data.client_id,
        loan_id: data.loan_id,
        savings_account_id: data.savings_account_id,
      });
      
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error initiating C2B payment:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDown className="h-5 w-5 text-green-600" />
            <span>M-Pesa C2B (Customer to Business)</span>
            <Badge variant="outline">Incoming Payments</Badge>
          </CardTitle>
          <CardDescription>
            Initiate STK Push requests for loan repayments and savings deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOpen ? (
            <Button onClick={() => setIsOpen(true)} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Initiate Payment Request
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="254701234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KES)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="account_reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="LOAN001 or SAV001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transaction_desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Loan repayment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="For loan repayments" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="savings_account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Savings Account ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="For savings deposits" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={initiatePayment.isPending}>
                    {initiatePayment.isPending ? "Sending..." : "Send Payment Request"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MPesaC2BForm;