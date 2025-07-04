import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUp, CreditCard, Send } from "lucide-react";
import { useInitiateB2CDisbursement } from "@/hooks/useIntegrations";

const b2cDisbursementSchema = z.object({
  phone_number: z.string().min(10, "Valid phone number is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  account_reference: z.string().min(1, "Account reference is required"),
  transaction_desc: z.string().min(1, "Transaction description is required"),
  loan_id: z.string().min(1, "Loan ID is required for disbursements"),
});

type B2CDisbursementForm = z.infer<typeof b2cDisbursementSchema>;

interface MPesaB2CFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

const MPesaB2CForm = ({ tenantId, onSuccess }: MPesaB2CFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const initiateDisbursement = useInitiateB2CDisbursement();

  const form = useForm<B2CDisbursementForm>({
    resolver: zodResolver(b2cDisbursementSchema),
    defaultValues: {
      phone_number: '',
      amount: 0,
      account_reference: '',
      transaction_desc: '',
      loan_id: '',
    },
  });

  const onSubmit = async (data: B2CDisbursementForm) => {
    try {
      await initiateDisbursement.mutateAsync({
        phone_number: data.phone_number,
        amount: data.amount,
        account_reference: data.account_reference,
        transaction_desc: data.transaction_desc,
        tenant_id: tenantId,
        loan_id: data.loan_id,
      });
      
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error initiating B2C disbursement:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUp className="h-5 w-5 text-blue-600" />
            <span>M-Pesa B2C (Business to Customer)</span>
            <Badge variant="outline">Outgoing Disbursements</Badge>
          </CardTitle>
          <CardDescription>
            Initiate loan disbursements and other payments to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOpen ? (
            <Button onClick={() => setIsOpen(true)} className="w-full" variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Initiate Disbursement
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
                            placeholder="10000" 
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
                    name="loan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan ID</FormLabel>
                        <FormControl>
                          <Input placeholder="LOAN-001" {...field} />
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
                          <Input placeholder="DISBURSEMENT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transaction_desc"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Transaction Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Loan disbursement for client" {...field} />
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
                  <Button type="submit" disabled={initiateDisbursement.isPending}>
                    {initiateDisbursement.isPending ? "Processing..." : "Initiate Disbursement"}
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

export default MPesaB2CForm;