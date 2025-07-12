import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CalendarIcon, Upload, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const addLoanAccountSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.string().min(1, "Loan amount is required"),
  loan_purpose: z.string().min(1, "Loan purpose is required"),
  fund_id: z.string().min(1, "Please select a fund"),
  expected_disbursement_date: z.date({
    required_error: "Expected disbursement date is required",
  }),
  savings_linkage: z.boolean().optional(),
  linked_savings_account: z.string().optional(),
  loan_term: z.string().min(1, "Loan term is required"),
  number_of_repayments: z.string().min(1, "Number of repayments is required"),
  first_repayment_date: z.date({
    required_error: "First repayment date is required",
  }),
  interest_rate: z.string().min(1, "Interest rate is required"),
  loan_charges: z.array(z.object({
    charge_type: z.string(),
    amount: z.string(),
  })).optional(),
  collateral_items: z.array(z.object({
    type: z.string(),
    description: z.string(),
    value: z.string(),
  })).optional(),
  required_documents: z.array(z.string()).optional(),
});

type AddLoanAccountData = z.infer<typeof addLoanAccountSchema>;

interface AddLoanAccountDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddLoanAccountDialog = ({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange,
  onSuccess 
}: AddLoanAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [collateralItems, setCollateralItems] = useState([{ type: "", description: "", value: "" }]);
  const [loanCharges, setLoanCharges] = useState([{ charge_type: "", amount: "" }]);

  const form = useForm<AddLoanAccountData>({
    resolver: zodResolver(addLoanAccountSchema),
    defaultValues: {
      loan_product_id: "",
      requested_amount: "",
      loan_purpose: "",
      fund_id: "",
      savings_linkage: false,
      linked_savings_account: "",
      loan_term: "",
      number_of_repayments: "",
      interest_rate: "",
      collateral_items: [],
      loan_charges: [],
      required_documents: [],
    },
  });

  const addCollateralItem = () => {
    setCollateralItems([...collateralItems, { type: "", description: "", value: "" }]);
  };

  const removeCollateralItem = (index: number) => {
    setCollateralItems(collateralItems.filter((_, i) => i !== index));
  };

  const addLoanCharge = () => {
    setLoanCharges([...loanCharges, { charge_type: "", amount: "" }]);
  };

  const removeLoanCharge = (index: number) => {
    setLoanCharges(loanCharges.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AddLoanAccountData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create the loan application
      const loanApplicationData = {
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: parseFloat(data.requested_amount),
        loan_purpose: data.loan_purpose,
        fund_id: data.fund_id,
        expected_disbursement_date: data.expected_disbursement_date?.toISOString(),
        savings_linkage: data.savings_linkage,
        linked_savings_account: data.linked_savings_account,
        loan_term_months: parseInt(data.loan_term),
        number_of_repayments: parseInt(data.number_of_repayments),
        first_repayment_date: data.first_repayment_date?.toISOString(),
        interest_rate: parseFloat(data.interest_rate),
        loan_charges: loanCharges.filter(charge => charge.charge_type && charge.amount),
        collateral_items: collateralItems.filter(item => item.type && item.description),
        required_documents: data.required_documents || [],
        status: 'pending_approval',
        application_date: new Date().toISOString(),
      };

      console.log('Creating comprehensive loan application:', loanApplicationData);

      toast({
        title: "Success",
        description: `Comprehensive loan application submitted successfully for ${clientName}`,
      });

      form.reset();
      setCollateralItems([{ type: "", description: "", value: "" }]);
      setLoanCharges([{ charge_type: "", amount: "" }]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to submit loan application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Add Loan Account
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive loan application for {clientName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="terms">Loan Terms</TabsTrigger>
                <TabsTrigger value="charges">Charges & Collateral</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loan_product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Product *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a loan product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal">Personal Loan (12% p.a.)</SelectItem>
                            <SelectItem value="business">Business Loan (10% p.a.)</SelectItem>
                            <SelectItem value="emergency">Emergency Loan (15% p.a.)</SelectItem>
                            <SelectItem value="asset">Asset Finance (14% p.a.)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fund_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fund source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Fund</SelectItem>
                            <SelectItem value="microfinance">Microfinance Fund</SelectItem>
                            <SelectItem value="women">Women's Fund</SelectItem>
                            <SelectItem value="youth">Youth Fund</SelectItem>
                            <SelectItem value="agriculture">Agriculture Fund</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requested_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Amount (KES) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 100000"
                            min="0"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (% p.a.) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 12.5"
                            min="0"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loan_purpose"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Loan Purpose *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Business expansion, School fees, Home improvement"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expected_disbursement_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Disbursement Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="savings_linkage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Link to Savings Account</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Link this loan to an existing savings account for automatic deductions
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("savings_linkage") && (
                    <FormField
                      control={form.control}
                      name="linked_savings_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Savings Account</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select savings account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings-001">Regular Savings - ACC001</SelectItem>
                              <SelectItem value="savings-002">Business Savings - ACC002</SelectItem>
                              <SelectItem value="savings-003">Fixed Deposit - ACC003</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loan_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Term (Months) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="18">18 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                            <SelectItem value="36">36 months</SelectItem>
                            <SelectItem value="48">48 months</SelectItem>
                            <SelectItem value="60">60 months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number_of_repayments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Repayments *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 12"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="first_repayment_date"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>First Repayment Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick first repayment date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="charges" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Loan Charges</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLoanCharge}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Charge
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {loanCharges.map((charge, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Select
                            value={charge.charge_type}
                            onValueChange={(value) => {
                              const newCharges = [...loanCharges];
                              newCharges[index].charge_type = value;
                              setLoanCharges(newCharges);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select charge type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="processing">Processing Fee</SelectItem>
                              <SelectItem value="administration">Administration Fee</SelectItem>
                              <SelectItem value="legal">Legal Fee</SelectItem>
                              <SelectItem value="insurance">Insurance Fee</SelectItem>
                              <SelectItem value="appraisal">Appraisal Fee</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={charge.amount}
                            onChange={(e) => {
                              const newCharges = [...loanCharges];
                              newCharges[index].amount = e.target.value;
                              setLoanCharges(newCharges);
                            }}
                          />
                        </div>
                        {loanCharges.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLoanCharge(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Collateral Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addCollateralItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Collateral
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {collateralItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-end">
                        <Select
                          value={item.type}
                          onValueChange={(value) => {
                            const newItems = [...collateralItems];
                            newItems[index].type = value;
                            setCollateralItems(newItems);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="vehicle">Vehicle</SelectItem>
                            <SelectItem value="machinery">Machinery</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                            <SelectItem value="guarantor">Personal Guarantor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...collateralItems];
                            newItems[index].description = e.target.value;
                            setCollateralItems(newItems);
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Value (KES)"
                          value={item.value}
                          onChange={(e) => {
                            const newItems = [...collateralItems];
                            newItems[index].value = e.target.value;
                            setCollateralItems(newItems);
                          }}
                        />
                        {collateralItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCollateralItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <FormField
                  control={form.control}
                  name="required_documents"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Required Documents</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Select all documents required for this loan application
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: "id_copy", label: "Copy of National ID" },
                          { id: "payslip", label: "Recent Payslips (3 months)" },
                          { id: "bank_statements", label: "Bank Statements (6 months)" },
                          { id: "business_permit", label: "Business Permit" },
                          { id: "tax_returns", label: "Tax Returns" },
                          { id: "collateral_documents", label: "Collateral Documentation" },
                          { id: "guarantor_forms", label: "Guarantor Forms" },
                          { id: "insurance_certificates", label: "Insurance Certificates" },
                          { id: "employment_letter", label: "Employment Letter" },
                          { id: "utility_bills", label: "Utility Bills (Proof of Residence)" },
                        ].map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="required_documents"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload documents or drag and drop
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PDF, DOC, DOCX up to 10MB each
                      </span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Loan Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};