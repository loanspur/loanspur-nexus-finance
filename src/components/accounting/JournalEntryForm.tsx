import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useCreateJournalEntry } from "@/hooks/useAccounting";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserAccessibleOffices } from "@/hooks/useOfficeManagement";

const journalEntrySchema = z.object({
  transaction_date: z.string().min(1, "Transaction date is required"),
  description: z.string().min(1, "Description is required"),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
  office_id: z.string().optional(),
  lines: z.array(z.object({
    account_id: z.string().min(1, "Account is required"),
    description: z.string().optional(),
    debit_amount: z.string(),
    credit_amount: z.string(),
  })).min(2, "At least two lines are required"),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JournalEntryForm = ({ open, onOpenChange }: JournalEntryFormProps) => {
  const createJournalEntryMutation = useCreateJournalEntry();
  const { data: accounts } = useChartOfAccounts();
  const { data: offices } = useUserAccessibleOffices();
  const { formatAmount } = useCurrency();

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      description: "",
      reference_type: "",
      reference_id: "",
      office_id: "",
      lines: [
        { account_id: "", description: "", debit_amount: "0", credit_amount: "0" },
        { account_id: "", description: "", debit_amount: "0", credit_amount: "0" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Fetch active accounts for the dropdowns
  const activeAccounts = accounts?.filter(acc => acc.is_active) || [];

  const onSubmit = async (data: JournalEntryFormData) => {
    try {
      await createJournalEntryMutation.mutateAsync({
        transaction_date: data.transaction_date,
        description: data.description,
        reference_type: data.reference_type,
        reference_id: data.reference_id,
        office_id: data.office_id,
        lines: data.lines.map(line => ({
          account_id: line.account_id,
          description: line.description,
          debit_amount: parseFloat(String(line.debit_amount)) || 0,
          credit_amount: parseFloat(String(line.credit_amount)) || 0,
        })),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating journal entry:', error);
    }
  };

  const calculateTotals = () => {
    const lines = form.watch('lines');
    const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(String(line.debit_amount)) || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(String(line.credit_amount)) || 0), 0);
    return { totalDebits, totalCredits };
  };

  const { totalDebits, totalCredits } = calculateTotals();
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="office_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch/Office</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch/office" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {offices?.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.office_name} ({office.office_code})
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
                name="reference_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reference type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="loan">Loan Transaction</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference ID (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Journal Entry Lines</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ account_id: "", description: "", debit_amount: "0", credit_amount: "0" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.account_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeAccounts?.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.account_code} - {account.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debit_amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (parseFloat(e.target.value) > 0) {
                                    form.setValue(`lines.${index}.credit_amount`, "0");
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.credit_amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (parseFloat(e.target.value) > 0) {
                                    form.setValue(`lines.${index}.debit_amount`, "0");
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1 flex justify-center">
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Balance Check: {isBalanced ? "✓ Balanced" : "⚠ Not Balanced"}
                  </div>
                  <div className="text-sm">
                    <span className="mr-4">Total Debits: {formatAmount(totalDebits)}</span>
                    <span>Total Credits: {formatAmount(totalCredits)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isBalanced || createJournalEntryMutation.isPending}
              >
                {createJournalEntryMutation.isPending ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};