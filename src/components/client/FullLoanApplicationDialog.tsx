import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Info,
  Download,
  Users
} from "lucide-react";
import { useGetApprovalWorkflow, useCreateApprovalRequest } from "@/hooks/useApprovalRequests";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const loanApplicationSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  loan_product_id: z.string().min(1, "Please select a loan product"),
  fund_source_id: z.string().min(1, "Please select fund source"),
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1 month"),
  number_of_installments: z.number().min(1, "Number of installments required"),
  repayment_frequency: z.string().min(1, "Please select repayment frequency"),
  interest_rate: z.number().min(0, "Interest rate must be 0 or greater"),
  calculation_method: z.string().min(1, "Please select calculation method"),
  first_repayment_date: z.date().optional(),
  purpose: z.string().min(1, "Please select loan purpose"),
  collateral_type: z.string().optional(),
  collateral_value: z.number().min(0).optional(),
  collateral_description: z.string().optional(),
  linked_savings_account_id: z.string().optional(),
  employment_type: z.string().min(1, "Please select employment type"),
  monthly_income: z.number().min(0, "Monthly income must be 0 or greater"),
  existing_debt: z.number().min(0, "Existing debt must be 0 or greater"),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  preferred_disbursement_method: z.string().min(1, "Please select disbursement method"),
  selected_charges: z.array(z.string()).optional(),
  custom_charges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    frequency: z.string(),
  })).optional(),
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
  const [customCharges, setCustomCharges] = useState<Array<{id: string, name: string, amount: number, frequency: string}>>([]);
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
      fund_source_id: "",
      requested_amount: 0,
      requested_term: 12,
      number_of_installments: 12,
      repayment_frequency: "monthly",
      interest_rate: 0,
      calculation_method: "flat",
      first_repayment_date: undefined,
      purpose: "",
      collateral_type: "",
      collateral_value: 0,
      collateral_description: "",
      linked_savings_account_id: "",
      employment_type: "",
      monthly_income: 0,
      existing_debt: 0,
      bank_name: "",
      bank_account_number: "",
      preferred_disbursement_method: "",
      selected_charges: [],
      custom_charges: [],
    },
  });

  // Fetch selected client info (read-only)
  const { data: selectedClientInfo } = useQuery({
    queryKey: ['client', preSelectedClientId],
    queryFn: async () => {
      if (!preSelectedClientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, client_number, monthly_income')
        .eq('id', preSelectedClientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!preSelectedClientId,
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

  // Mock fund sources since fund_sources table doesn't exist
  const fundSources = [
    { id: '1', name: 'Primary Fund' },
    { id: '2', name: 'Secondary Fund' },
    { id: '3', name: 'Emergency Fund' },
  ];

  const selectedProduct = loanProducts?.find(p => p.id === form.watch('loan_product_id'));
  
  // Mock product charges since loan_product_charges table doesn't exist yet
  const productCharges = selectedProduct ? [
    { id: '1', name: 'Processing Fee', amount: 2500, frequency: 'One Time' },
    { id: '2', name: 'Insurance Premium', amount: 500, frequency: 'Monthly' },
    { id: '3', name: 'Application Fee', amount: 1000, frequency: 'One Time' },
    { id: '4', name: 'Transfer Charge', amount: 50, frequency: 'One Time' },
  ] : [];

  // Fetch client's savings accounts for linking
  const { data: clientSavingsAccounts } = useQuery({
    queryKey: ['client-savings', preSelectedClientId],
    queryFn: async () => {
      if (!preSelectedClientId) return [];
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          id, 
          account_number, 
          account_balance, 
          savings_products!inner(name)
        `)
        .eq('client_id', preSelectedClientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!preSelectedClientId,
  });

  // Check if there are transfer charges selected
  const hasTransferCharges = form.watch('selected_charges')?.some(chargeId => 
    productCharges.find(charge => charge.id === chargeId && charge.name.toLowerCase().includes('transfer'))
  );
  const requestedAmount = form.watch('requested_amount');
  const numberOfInstallments = form.watch('number_of_installments');
  const interestRate = form.watch('interest_rate');
  const requestedTerm = form.watch('requested_term');
  const firstRepaymentDate = form.watch('first_repayment_date');

  // Import product default settings when product is selected
  useEffect(() => {
    if (selectedProduct) {
      form.setValue('requested_amount', selectedProduct.default_principal || 0);
      form.setValue('requested_term', selectedProduct.default_term || 12);
      form.setValue('number_of_installments', selectedProduct.default_term || 12);
      form.setValue('interest_rate', selectedProduct.default_nominal_interest_rate || 0);
    }
  }, [selectedProduct, form]);

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

  const generateRepaymentSchedulePDF = async () => {
    // Dynamic import to avoid bundle size issues
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text('LOAN REPAYMENT SCHEDULE', 105, 20, { align: 'center' });
    
    // Client and loan information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Client: ${selectedClientInfo?.first_name} ${selectedClientInfo?.last_name}`, 20, 40);
    doc.text(`Client Number: ${selectedClientInfo?.client_number}`, 20, 50);
    doc.text(`Product: ${selectedProduct?.name}`, 20, 60);
    doc.text(`Generated: ${currentDate}`, 140, 40);
    doc.text(`Loan Amount: ${formatCurrency(requestedAmount)}`, 140, 50);
    doc.text(`Term: ${requestedTerm} months`, 140, 60);
    
    // Loan summary
    doc.setFontSize(14);
    doc.text('Loan Summary', 20, 80);
    doc.setFontSize(10);
    
    const summaryData = [
      ['Principal Amount', formatCurrency(requestedAmount)],
      ['Interest Rate', `${interestRate}% p.a.`],
      ['Term', `${requestedTerm} months`],
      ['Monthly Payment', formatCurrency(calculateMonthlyPayment())],
      ['Total Interest', formatCurrency(calculateTotalInterest())],
      ['Total Payment', formatCurrency(calculateTotalPayment())],
      ['First Payment Date', firstRepaymentDate ? format(firstRepaymentDate, 'MMM dd, yyyy') : 'Not specified']
    ];
    
    (doc as any).autoTable({
      startY: 90,
      head: [['Description', 'Details']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 }
    });
    
    // Repayment schedule
    doc.setFontSize(14);
    doc.text('Repayment Schedule', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const scheduleData = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      const monthlyPayment = calculateMonthlyPayment();
      const interestPayment = (requestedAmount * (interestRate / 100)) / 12;
      const principalPayment = monthlyPayment - interestPayment;
      const remainingBalance = requestedAmount - (principalPayment * i);
      const dueDate = firstRepaymentDate ? 
        new Date(firstRepaymentDate.getTime() + ((i - 1) * 30 * 24 * 60 * 60 * 1000)) :
        new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000));
      
      scheduleData.push([
        i.toString(),
        format(dueDate, 'MMM dd, yyyy'),
        formatCurrency(principalPayment),
        formatCurrency(interestPayment),
        formatCurrency(monthlyPayment),
        formatCurrency(Math.max(0, remainingBalance))
      ]);
    }
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 30,
      head: [['#', 'Due Date', 'Principal', 'Interest', 'Payment', 'Balance']],
      body: scheduleData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    });
    
    // Sign-off section
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(12);
    doc.text('Client Acknowledgment', 20, finalY);
    doc.setFontSize(10);
    doc.text('I acknowledge that I have read and understood the repayment schedule above.', 20, finalY + 15);
    
    // Signature lines
    doc.line(20, finalY + 40, 80, finalY + 40);
    doc.text('Client Signature', 20, finalY + 50);
    doc.text('Date: _______________', 20, finalY + 60);
    
    doc.line(120, finalY + 40, 180, finalY + 40);
    doc.text('Loan Officer Signature', 120, finalY + 50);
    doc.text('Date: _______________', 120, finalY + 60);
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Generated on ${currentDate}`, 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`loan-repayment-schedule-${selectedClientInfo?.client_number}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                      {/* Client Info (Read-only) */}
                      {selectedClientInfo && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Client Information</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedClientInfo.first_name} {selectedClientInfo.last_name} ({selectedClientInfo.client_number})
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <FormField
                          control={form.control}
                          name="fund_source_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fund Source</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select fund source" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {fundSources.map((source) => (
                                    <SelectItem key={source.id} value={source.id}>
                                      {source.name}
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

                      {/* Linked Savings Account Section - Only show if transfer charges are selected */}
                      {hasTransferCharges && (
                        <Card className="bg-blue-50/50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Linked Savings Account
                            </CardTitle>
                            <CardDescription>
                              Select a savings account for transfer charges and disbursement
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <FormField
                              control={form.control}
                              name="linked_savings_account_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Savings Account</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select savings account" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {clientSavingsAccounts?.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                          {account.account_number} - {account.savings_products?.name} 
                                          (Balance: {formatCurrency(account.account_balance)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                  {clientSavingsAccounts?.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      No active savings accounts found for this client
                                    </p>
                                  )}
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      )}

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Purpose</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select loan purpose" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="business_expansion">Business Expansion</SelectItem>
                                <SelectItem value="working_capital">Working Capital</SelectItem>
                                <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                                <SelectItem value="inventory_purchase">Inventory Purchase</SelectItem>
                                <SelectItem value="home_improvement">Home Improvement</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="medical_expenses">Medical Expenses</SelectItem>
                                <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                                <SelectItem value="agriculture">Agriculture</SelectItem>
                                <SelectItem value="transport">Transport</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Collateral Section */}
                      <Card className="bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-sm">Collateral Information (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="collateral_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Collateral Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select collateral type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="land">Land</SelectItem>
                                      <SelectItem value="property">Property/Real Estate</SelectItem>
                                      <SelectItem value="vehicle">Vehicle</SelectItem>
                                      <SelectItem value="machinery">Machinery/Equipment</SelectItem>
                                      <SelectItem value="inventory">Inventory/Stock</SelectItem>
                                      <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                                      <SelectItem value="shares">Shares/Securities</SelectItem>
                                      <SelectItem value="jewelry">Jewelry/Gold</SelectItem>
                                      <SelectItem value="livestock">Livestock</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="collateral_value"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estimated Value (KES)</FormLabel>
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
                          </div>

                          <FormField
                            control={form.control}
                            name="collateral_description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Provide detailed description of the collateral..."
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

                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Information Tab */}
                <TabsContent value="financial" className="space-y-6">
                  {/* Loan Details Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Loan Terms & Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="requested_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Amount (KES)</FormLabel>
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
                              <FormLabel>Term (Months)</FormLabel>
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

                        <FormField
                          control={form.control}
                          name="number_of_installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Installments</FormLabel>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="first_repayment_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>First Repayment Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
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
                                      <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date() || date < new Date("1900-01-01")
                                    }
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="repayment_frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repayment Frequency</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                                  <SelectItem value="annually">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="interest_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interest Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="12.50"
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
                          name="calculation_method"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calculation Method</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="flat">Flat Rate</SelectItem>
                                  <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                                  <SelectItem value="compound">Compound Interest</SelectItem>
                                  <SelectItem value="simple">Simple Interest</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Loan Charges Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Associated Loan Charges
                      </CardTitle>
                      <CardDescription>
                        Select applicable charges for this loan product
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Product Mapped Charges */}
                        {productCharges && productCharges.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Product Mapped Charges</h4>
                            {productCharges.map((charge: any) => (
                              <div key={charge.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`charge-${charge.id}`}
                                    onChange={(e) => {
                                      const selectedCharges = form.getValues('selected_charges') || [];
                                      if (e.target.checked) {
                                        form.setValue('selected_charges', [...selectedCharges, charge.id]);
                                      } else {
                                        form.setValue('selected_charges', selectedCharges.filter(id => id !== charge.id));
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <label htmlFor={`charge-${charge.id}`} className="text-sm font-medium">
                                    {charge.name}
                                  </label>
                                </div>
                                <div className="flex-1 flex justify-between text-sm text-muted-foreground">
                                  <span>{formatCurrency(charge.amount)}</span>
                                  <span>{charge.frequency}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Custom Charges Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Additional Charges</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newCharge = {
                                  id: `custom-${Date.now()}`,
                                  name: '',
                                  amount: 0,
                                  frequency: 'One Time'
                                };
                                setCustomCharges([...customCharges, newCharge]);
                              }}
                            >
                              Add Charge
                            </Button>
                          </div>

                          {customCharges.map((charge, index) => (
                            <div key={charge.id} className="grid grid-cols-4 gap-2 p-3 border rounded-lg bg-muted/30">
                              <Input
                                type="text"
                                placeholder="Charge name"
                                value={charge.name}
                                onChange={(e) => {
                                  const updated = [...customCharges];
                                  updated[index] = { ...charge, name: e.target.value };
                                  setCustomCharges(updated);
                                  form.setValue('custom_charges', updated);
                                }}
                                className="h-8"
                              />
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={charge.amount || ''}
                                onChange={(e) => {
                                  const updated = [...customCharges];
                                  updated[index] = { ...charge, amount: parseFloat(e.target.value) || 0 };
                                  setCustomCharges(updated);
                                  form.setValue('custom_charges', updated);
                                }}
                                className="h-8"
                              />
                              <Select
                                value={charge.frequency}
                                onValueChange={(value) => {
                                  const updated = [...customCharges];
                                  updated[index] = { ...charge, frequency: value };
                                  setCustomCharges(updated);
                                  form.setValue('custom_charges', updated);
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="One Time">One Time</SelectItem>
                                  <SelectItem value="Monthly">Monthly</SelectItem>
                                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                                  <SelectItem value="Annually">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = customCharges.filter((_, i) => i !== index);
                                  setCustomCharges(updated);
                                  form.setValue('custom_charges', updated);
                                }}
                                className="h-8"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}

                          {customCharges.length === 0 && (
                            <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
                              No additional charges added. Click "Add Charge" to include custom fees.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Financial Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Client Financial Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="employment_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employment Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="employed">Employed</SelectItem>
                                  <SelectItem value="self_employed">Self Employed</SelectItem>
                                  <SelectItem value="business_owner">Business Owner</SelectItem>
                                  <SelectItem value="farmer">Farmer</SelectItem>
                                  <SelectItem value="unemployed">Unemployed</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
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
                              <FormLabel>Monthly Income (KES)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                              {selectedClientInfo?.monthly_income && (
                                <p className="text-xs text-muted-foreground">
                                  Client record shows: {formatCurrency(selectedClientInfo.monthly_income)}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existing_debt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Existing Monthly Debt (KES)</FormLabel>
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Repayment Schedule Preview */}
                  {requestedAmount > 0 && numberOfInstallments > 0 && interestRate > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CalendarDays className="w-5 h-5" />
                          Repayment Schedule Preview
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={generateRepaymentSchedulePDF}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF Schedule
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{formatCurrency(calculateMonthlyPayment())}</div>
                              <div className="text-sm text-muted-foreground">Monthly Payment</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{formatCurrency(calculateTotalPayment())}</div>
                              <div className="text-sm text-muted-foreground">Total Payment</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">{formatCurrency(calculateTotalInterest())}</div>
                              <div className="text-sm text-muted-foreground">Total Interest</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRiskLevel().color}`}>
                                {calculateDebtToIncomeRatio().toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Debt-to-Income</div>
                              <Badge variant="secondary" className={`mt-1 ${getRiskLevel().bgColor}`}>
                                {getRiskLevel().level} Risk
                              </Badge>
                            </div>
                          </div>

                          {/* Schedule Table Preview (first 5 payments) */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted p-3">
                              <div className="grid grid-cols-5 gap-2 text-sm font-medium">
                                <div>Payment #</div>
                                <div>Due Date</div>
                                <div>Principal</div>
                                <div>Interest</div>
                                <div>Balance</div>
                              </div>
                            </div>
                            <div className="divide-y">
                              {Array.from({ length: Math.min(5, numberOfInstallments) }, (_, i) => {
                                const paymentNumber = i + 1;
                                const monthlyPayment = calculateMonthlyPayment();
                                const interestPayment = (requestedAmount * (interestRate / 100)) / 12;
                                const principalPayment = monthlyPayment - interestPayment;
                                const remainingBalance = requestedAmount - (principalPayment * paymentNumber);
                                const dueDate = firstRepaymentDate ? 
                                  new Date(firstRepaymentDate.getTime() + ((paymentNumber - 1) * 30 * 24 * 60 * 60 * 1000)) :
                                  new Date(Date.now() + (paymentNumber * 30 * 24 * 60 * 60 * 1000));
                                
                                return (
                                  <div key={i} className="grid grid-cols-5 gap-2 p-3 text-sm">
                                    <div>{paymentNumber}</div>
                                    <div>{dueDate.toLocaleDateString()}</div>
                                    <div>{formatCurrency(principalPayment)}</div>
                                    <div>{formatCurrency(interestPayment)}</div>
                                    <div>{formatCurrency(Math.max(0, remainingBalance))}</div>
                                  </div>
                                );
                              })}
                            </div>
                            {numberOfInstallments > 5 && (
                              <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50">
                                ... and {numberOfInstallments - 5} more payments
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Guarantor Information Tab - removed as per request */}
                <TabsContent value="guarantor" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Additional Information
                      </CardTitle>
                      <CardDescription>
                        Review loan details and associated charges
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                        All loan details and charges are configured in the previous tabs.
                      </div>
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
                            <p>{selectedClientInfo?.first_name} {selectedClientInfo?.last_name}</p>
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