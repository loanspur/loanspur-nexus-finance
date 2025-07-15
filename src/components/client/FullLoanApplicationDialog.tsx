import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CalendarDays, 
  DollarSign, 
  FileText, 
  User, 
  CreditCard, 
  Shield, 
  Target,
  Calculator,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { useGetApprovalWorkflow, useCreateApprovalRequest } from "@/hooks/useApprovalRequests";
import { useToast } from "@/hooks/use-toast";

const loanApplicationSchema = z.object({
  client_id: z.string().min(1, "Please select a client"),
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1 month"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  collateral_description: z.string().optional(),
  employment_type: z.string().min(1, "Please select employment type"),
  monthly_income: z.number().min(0, "Monthly income must be 0 or greater"),
  existing_debt: z.number().min(0, "Existing debt must be 0 or greater"),
  guarantor_name: z.string().optional(),
  guarantor_phone: z.string().optional(),
  guarantor_relationship: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  preferred_disbursement_method: z.string().min(1, "Please select disbursement method"),
});

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

interface FullLoanApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedClientId?: string;
  onApplicationCreated?: () => void;
}

export const FullLoanApplicationDialog = ({ 
  open, 
  onOpenChange, 
  preSelectedClientId,
  onApplicationCreated 
}: FullLoanApplicationDialogProps) => {
  const [currentTab, setCurrentTab] = useState("basic");
  const { profile } = useAuth();
  const { toast } = useToast();
  const createLoanApplication = useCreateLoanApplication();
  const createApprovalRequest = useCreateApprovalRequest();
  
  // Get loan application approval workflow
  const { data: approvalWorkflow } = useGetApprovalWorkflow('loan_applications', 'loan_approval');

  const form = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      client_id: preSelectedClientId || "",
      requested_amount: 0,
      requested_term: 12,
      purpose: "",
      collateral_description: "",
      employment_type: "",
      monthly_income: 0,
      existing_debt: 0,
      guarantor_name: "",
      guarantor_phone: "",
      guarantor_relationship: "",
      bank_name: "",
      bank_account_number: "",
      preferred_disbursement_method: "",
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ['clients', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, client_number, monthly_income')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch loan products
  const { data: loanProducts } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const selectedProduct = loanProducts?.find(p => p.id === form.watch('loan_product_id'));
  const selectedClient = clients?.find(c => c.id === form.watch('client_id'));
  const requestedAmount = form.watch('requested_amount');
  const requestedTerm = form.watch('requested_term');

  // Calculate loan metrics
  const calculateMonthlyPayment = () => {
    if (!selectedProduct || !requestedAmount || !requestedTerm) return 0;
    const monthlyRate = (selectedProduct.default_nominal_interest_rate || 0) / 100 / 12;
    if (monthlyRate === 0) return requestedAmount / requestedTerm;
    return requestedAmount * (monthlyRate * Math.pow(1 + monthlyRate, requestedTerm)) / (Math.pow(1 + monthlyRate, requestedTerm) - 1);
  };

  const calculateTotalPayment = () => {
    return calculateMonthlyPayment() * requestedTerm;
  };

  const calculateTotalInterest = () => {
    return calculateTotalPayment() - requestedAmount;
  };

  const calculateDebtToIncomeRatio = () => {
    const monthlyIncome = form.watch('monthly_income');
    const existingDebt = form.watch('existing_debt');
    const newPayment = calculateMonthlyPayment();
    if (!monthlyIncome || monthlyIncome === 0) return 0;
    return ((existingDebt + newPayment) / monthlyIncome) * 100;
  };

  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
      // Create the loan application
      const application = await createLoanApplication.mutateAsync({
        client_id: data.client_id,
        loan_product_id: data.loan_product_id,
        requested_amount: data.requested_amount,
        requested_term: data.requested_term,
        purpose: data.purpose,
        status: approvalWorkflow ? 'under_review' : 'pending',
      });

      // If approval workflow exists, create approval request
      if (approvalWorkflow && application) {
        await createApprovalRequest.mutateAsync({
          workflow_id: approvalWorkflow.id,
          record_id: application.id,
          record_data: {
            client_id: data.client_id,
            loan_product_id: data.loan_product_id,
            requested_amount: data.requested_amount,
            requested_term: data.requested_term,
            purpose: data.purpose,
            employment_type: data.employment_type,
            monthly_income: data.monthly_income,
            existing_debt: data.existing_debt,
            debt_to_income_ratio: calculateDebtToIncomeRatio(),
          },
          priority: data.requested_amount > 100000 ? 'high' : 'normal',
          reason: `Loan application for ${new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(data.requested_amount)}`,
        });
      }
      
      form.reset();
      onOpenChange(false);
      onApplicationCreated?.();
      
      toast({
        title: "Success",
        description: "Loan application submitted successfully",
      });
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to submit loan application",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getRiskLevel = () => {
    const ratio = calculateDebtToIncomeRatio();
    if (ratio > 60) return { level: 'High', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (ratio > 40) return { level: 'Medium', color: 'text-warning', bgColor: 'bg-warning/10' };
    return { level: 'Low', color: 'text-success', bgColor: 'bg-success/10' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Complete Loan Application
          </DialogTitle>
          <DialogDescription>
            Submit a comprehensive loan application with all required details
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="guarantor" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Guarantor
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Client & Product Selection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                  {clients?.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.first_name} {client.last_name} ({client.client_number})
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
                          name="loan_product_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Product</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loanProducts?.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({product.default_nominal_interest_rate}% - {product.default_term}mo)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {selectedProduct && (
                        <Card className="bg-muted/50">
                          <CardHeader>
                            <CardTitle className="text-sm">Product Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Interest Rate:</span>
                                <Badge variant="secondary" className="ml-2">{selectedProduct.default_nominal_interest_rate}%</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Max Amount:</span>
                                <Badge variant="secondary" className="ml-2">{formatCurrency(selectedProduct.max_principal || 0)}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Min Amount:</span>
                                <Badge variant="secondary" className="ml-2">{formatCurrency(selectedProduct.min_principal || 0)}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Default Term:</span>
                                <Badge variant="secondary" className="ml-2">{selectedProduct.default_term} months</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="requested_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Requested Amount
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requested_term"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Term (Months)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="12"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Purpose</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the purpose of this loan in detail..."
                                className="resize-none min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="collateral_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collateral Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe any collateral for this loan..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Information Tab */}
                <TabsContent value="financial" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Financial Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="employment_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employment Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select employment type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="employed">Employed</SelectItem>
                                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                                  <SelectItem value="business_owner">Business Owner</SelectItem>
                                  <SelectItem value="freelancer">Freelancer</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
                                  <SelectItem value="unemployed">Unemployed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="monthly_income"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Income</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                              {selectedClient?.monthly_income && (
                                <p className="text-xs text-muted-foreground">
                                  Client record shows: {formatCurrency(selectedClient.monthly_income)}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="existing_debt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Existing Monthly Debt Payments</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preferred_disbursement_method"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Disbursement Method</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="check">Check</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch('preferred_disbursement_method') === 'bank_transfer' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bank_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter bank name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bank_account_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter account number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Loan Calculator */}
                  {requestedAmount > 0 && selectedProduct && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Loan Calculator</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monthly Payment:</span>
                            <p className="font-medium">{formatCurrency(calculateMonthlyPayment())}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Payment:</span>
                            <p className="font-medium">{formatCurrency(calculateTotalPayment())}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Interest:</span>
                            <p className="font-medium">{formatCurrency(calculateTotalInterest())}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Debt-to-Income:</span>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{calculateDebtToIncomeRatio().toFixed(1)}%</p>
                              <Badge variant="outline" className={getRiskLevel().color}>
                                {getRiskLevel().level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Guarantor Information Tab */}
                <TabsContent value="guarantor" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Guarantor Information (Optional)
                      </CardTitle>
                      <CardDescription>
                        Adding a guarantor may improve your loan approval chances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="guarantor_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guarantor Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter guarantor's full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="guarantor_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guarantor Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter guarantor's phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="guarantor_relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Guarantor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="colleague">Colleague</SelectItem>
                                <SelectItem value="business_partner">Business Partner</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Application Review
                      </CardTitle>
                      <CardDescription>
                        Please review all information before submitting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Client & Product Info */}
                      <div>
                        <h4 className="font-medium mb-2">Client & Product</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Client:</span>
                            <p>{selectedClient?.first_name} {selectedClient?.last_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Product:</span>
                            <p>{selectedProduct?.name}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Loan Details */}
                      <div>
                        <h4 className="font-medium mb-2">Loan Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">{formatCurrency(requestedAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Term:</span>
                            <p>{requestedTerm} months</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Payment:</span>
                            <p className="font-medium">{formatCurrency(calculateMonthlyPayment())}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Interest:</span>
                            <p>{formatCurrency(calculateTotalInterest())}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Risk Assessment */}
                      <div>
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getRiskLevel().bgColor}`}>
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {getRiskLevel().level} Risk ({calculateDebtToIncomeRatio().toFixed(1)}% DTI)
                            </span>
                          </div>
                        </div>
                      </div>

                      {form.watch('purpose') && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Purpose</h4>
                            <p className="text-sm text-muted-foreground">{form.watch('purpose')}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Navigation and Submit */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    {currentTab !== "basic" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const tabs = ["basic", "financial", "guarantor", "review"];
                          const currentIndex = tabs.indexOf(currentTab);
                          if (currentIndex > 0) {
                            setCurrentTab(tabs[currentIndex - 1]);
                          }
                        }}
                      >
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    
                    {currentTab !== "review" ? (
                      <Button
                        type="button"
                        onClick={() => {
                          const tabs = ["basic", "financial", "guarantor", "review"];
                          const currentIndex = tabs.indexOf(currentTab);
                          if (currentIndex < tabs.length - 1) {
                            setCurrentTab(tabs[currentIndex + 1]);
                          }
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={createLoanApplication.isPending}
                      >
                        {createLoanApplication.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};