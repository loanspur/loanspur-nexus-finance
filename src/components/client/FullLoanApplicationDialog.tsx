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
  Users,
  Plus,
  X
} from "lucide-react";
import { useGetApprovalWorkflow, useCreateApprovalRequest } from "@/hooks/useApprovalRequests";
import { useToast } from "@/hooks/use-toast";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useLoanPurposes } from "@/hooks/useLoanPurposes";
import { useCollateralTypes } from "@/hooks/useCollateralTypes";
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
  selected_charges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    amount: z.number(),
    collected_on: z.string(),
    due_date: z.string().optional(),
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
  const [selectedCharges, setSelectedCharges] = useState<Array<{
    id: string;
    name: string;
    type: string;
    amount: number;
    collected_on: string;
    due_date?: string;
  }>>([]);
  const [newCharge, setNewCharge] = useState({
    name: '',
    type: 'Flat',
    amount: '',
    collected_on: 'Specified due date',
    due_date: ''
  });
  const { profile } = useAuth();
  const { toast } = useToast();
  const createLoanApplication = useCreateLoanApplication();
  const createApprovalRequest = useCreateApprovalRequest();
  
  // Get loan application approval workflow
  const { data: approvalWorkflow } = useGetApprovalWorkflow('loan_applications', 'loan_approval');
  
  // Get system code values
  const { data: loanPurposes = [] } = useLoanPurposes();
  const { data: collateralTypes = [] } = useCollateralTypes();

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

  // Get fund sources from database
  const { data: fundSources = [] } = useQuery({
    queryKey: ['fund-sources'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) return [];

      // Fetch funds for this tenant
      const { data: funds } = await supabase
        .from('funds')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      return funds?.map(fund => ({
        id: fund.id,
        name: `${fund.fund_name} (${fund.fund_code})`
      })) || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const selectedProduct = loanProducts?.find(p => p.id === form.watch('loan_product_id'));
  
  // Fetch global fee structures for loan charges
  const { data: feeStructures = [] } = useFeeStructures();
  const availableCharges = feeStructures.filter(fee => 
    fee.fee_type === 'loan' && fee.is_active
  ).map(fee => ({
    id: fee.id,
    name: fee.name,
    type: fee.calculation_type === 'fixed' ? 'Flat' : 'Percentage',
    amount: fee.amount,
    percentage_rate: fee.percentage_rate,
    min_amount: fee.min_amount,
    max_amount: fee.max_amount,
    charge_time_type: fee.charge_time_type,
    charge_payment_by: fee.charge_payment_by,
    description: fee.description
  }));

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
  const hasTransferCharges = selectedCharges.some(charge => 
    charge.name.toLowerCase().includes('transfer')
  );

  // Function to add a new charge
  const addCharge = () => {
    if (newCharge.name && newCharge.amount) {
      const charge = {
        id: `charge-${Date.now()}`,
        name: newCharge.name,
        type: newCharge.type,
        amount: parseFloat(newCharge.amount),
        collected_on: newCharge.collected_on,
        due_date: newCharge.due_date || undefined,
      };
      
      const updatedCharges = [...selectedCharges, charge];
      setSelectedCharges(updatedCharges);
      form.setValue('selected_charges', updatedCharges);
      
      // Reset form and dropdown
      setNewCharge({
        name: '',
        type: 'Flat',
        amount: '',
        collected_on: 'Specified due date',
        due_date: ''
      });
    }
  };

  // Function to remove a charge
  const removeCharge = (chargeId: string) => {
    const updatedCharges = selectedCharges.filter(charge => charge.id !== chargeId);
    setSelectedCharges(updatedCharges);
    form.setValue('selected_charges', updatedCharges);
  };
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Financial
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
                                 {loanPurposes.length === 0 ? (
                                   <SelectItem value="no-purposes" disabled>No loan purposes configured</SelectItem>
                                 ) : (
                                   loanPurposes.map((purpose) => (
                                     <SelectItem key={purpose.id} value={purpose.code_value}>
                                       {purpose.name}
                                     </SelectItem>
                                   ))
                                 )}
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
                                       {collateralTypes.length === 0 ? (
                                         <SelectItem value="no-types" disabled>No collateral types configured</SelectItem>
                                       ) : (
                                         collateralTypes.map((type) => (
                                           <SelectItem key={type.id} value={type.code_value}>
                                             {type.name}
                                           </SelectItem>
                                         ))
                                       )}
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
                      <div className="space-y-6">
                        {/* Add Charge Section */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                             <div className="flex-1">
                               <label className="text-sm font-medium text-muted-foreground">Charges:</label>
                                <Select
                                  value={newCharge.name}
                                  onValueChange={(value) => {
                                    if (value === 'custom') {
                                      setNewCharge({
                                        name: '',
                                        type: 'Flat',
                                        amount: '',
                                        collected_on: 'Specified due date',
                                        due_date: ''
                                      });
                                    } else {
                                      const selectedFee = availableCharges.find(charge => charge.id === value);
                                      if (selectedFee) {
                                        setNewCharge({
                                          name: selectedFee.name,
                                          type: selectedFee.type,
                                          amount: selectedFee.type === 'Flat' ? selectedFee.amount.toString() : selectedFee.percentage_rate?.toString() || '',
                                          collected_on: selectedFee.charge_time_type === 'upfront' ? 'Disbursement' : 'Specified due date',
                                          due_date: ''
                                        });
                                      }
                                    }
                                  }}
                                >
                                 <SelectTrigger className="mt-1">
                                   <SelectValue placeholder="Select charge or create custom" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-background border shadow-md z-50">
                                    <SelectItem value="custom" className="hover:bg-muted cursor-pointer">
                                      <div className="flex flex-col">
                                        <span className="font-medium">Create Custom Charge</span>
                                        <span className="text-xs text-muted-foreground">Define your own charge</span>
                                      </div>
                                    </SelectItem>
                                    {availableCharges.length === 0 ? (
                                      <SelectItem value="no-charges" disabled>No loan charges configured</SelectItem>
                                    ) : (
                                      availableCharges.map((charge) => (
                                        <SelectItem 
                                          key={charge.id} 
                                          value={charge.id}
                                          className="hover:bg-muted cursor-pointer"
                                        >
                                          <div className="flex flex-col">
                                            <span>{charge.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {charge.type} - {charge.description || 'No description'}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))
                                    )}
                                 </SelectContent>
                               </Select>
                             </div>
                             <Button
                               type="button"
                               onClick={addCharge}
                               disabled={!newCharge.name || !newCharge.amount || newCharge.name === 'custom'}
                               className="mt-6"
                             >
                              <Plus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </div>

                             {/* Charge Details Form */}
                             {(newCharge.name === 'custom' || (newCharge.name !== '' && newCharge.name !== 'custom')) && (
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="md:col-span-5 mb-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Info className="w-4 h-4" />
                                    Values are pre-filled from fee structure but can be modified
                                  </div>
                                </div>
                                 <div>
                                   <label className="text-sm font-medium">Charge Name</label>
                                   <Input
                                     value={newCharge.name}
                                     onChange={(e) => newCharge.name === '' ? setNewCharge({ ...newCharge, name: e.target.value }) : null}
                                     placeholder="Enter charge name"
                                     className="mt-1"
                                     readOnly={newCharge.name !== ''}
                                   />
                                 </div>
                                 <div>
                                   <label className="text-sm font-medium">Type</label>
                                   <Select
                                     value={newCharge.type}
                                     onValueChange={(value) => newCharge.name === '' ? setNewCharge({ ...newCharge, type: value }) : null}
                                     disabled={newCharge.name !== ''}
                                   >
                                     <SelectTrigger className="mt-1">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="Flat">Flat</SelectItem>
                                       <SelectItem value="Percentage">Percentage</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div>
                                   <label className="text-sm font-medium">
                                     {newCharge.type === 'Flat' ? 'Amount' : 'Rate (%)'}
                                   </label>
                                   <Input
                                     type="number"
                                     value={newCharge.amount}
                                     onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                                     placeholder="0.00"
                                     className="mt-1"
                                   />
                                 </div>
                                 <div>
                                   <label className="text-sm font-medium">Charge Time</label>
                                   <Select
                                     value={newCharge.collected_on}
                                     onValueChange={(value) => newCharge.name === '' ? setNewCharge({ ...newCharge, collected_on: value }) : null}
                                     disabled={newCharge.name !== ''}
                                   >
                                     <SelectTrigger className="mt-1">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="Disbursement">Disbursement</SelectItem>
                                       <SelectItem value="Specified due date">Specified due date</SelectItem>
                                       <SelectItem value="Instalment Fee">Instalment Fee</SelectItem>
                                       <SelectItem value="Overdue Fees">Overdue Fees</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                <div>
                                  <label className="text-sm font-medium">Due Date</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-1",
                                          !newCharge.due_date && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {newCharge.due_date ? format(new Date(newCharge.due_date), "PPP") : "Pick a due date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={newCharge.due_date ? new Date(newCharge.due_date) : undefined}
                                        onSelect={(date) => setNewCharge({ ...newCharge, due_date: date ? date.toISOString().split('T')[0] : '' })}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                             </div>
                           )}
                        </div>

                        {/* Charges Table */}
                        {selectedCharges.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 px-4 py-3 border-b">
                              <h4 className="font-medium">Selected Charges</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-muted/50">
                                  <tr>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Charge Time</th>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                                     <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {selectedCharges.map((charge) => (
                                    <tr key={charge.id} className="hover:bg-muted/30">
                                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                        {charge.name}
                                      </td>
                                      <td className="px-4 py-3 text-sm">{charge.type}</td>
                                      <td className="px-4 py-3 text-sm">
                                        {charge.type === 'Percentage' ? `${charge.amount}%` : formatCurrency(charge.amount)}
                                      </td>
                                       <td className="px-4 py-3 text-sm">{charge.collected_on}</td>
                                       <td className="px-4 py-3 text-sm">{charge.due_date ? format(new Date(charge.due_date), "PPP") : 'No due date'}</td>
                                      <td className="px-4 py-3">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeCharge(charge.id)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {selectedCharges.length === 0 && (
                          <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
                            No charges added. Select a charge from the dropdown above to add fees.
                          </div>
                        )}
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
                          const tabs = ["basic", "financial", "review"];
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
                          const tabs = ["basic", "financial", "review"];
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