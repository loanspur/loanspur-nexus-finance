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
  preSelectedProductId?: string;
  onApplicationCreated?: () => void;
}

export const FullLoanApplicationDialog = ({
  open,
  onOpenChange,
  preSelectedClientId,
  preSelectedProductId,
  onApplicationCreated,
}: FullLoanApplicationDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const createLoanApplication = useCreateLoanApplication();
  const createApprovalRequest = useCreateApprovalRequest();
  const [currentTab, setCurrentTab] = useState<string>("basic");
  const [selectedCharges, setSelectedCharges] = useState<any[]>([]);
  const [newCharge, setNewCharge] = useState({
    name: '',
    type: 'Flat',
    amount: '',
    collected_on: 'Specified due date',
    due_date: ''
  });

  // Get available charges from fee structures
  const { data: feeStructures = [] } = useFeeStructures();
  const availableCharges = feeStructures.filter(fee => fee.is_active && fee.fee_type === 'Loan');

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
        .select('id, first_name, last_name, client_number')
        .eq('id', preSelectedClientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!preSelectedClientId,
  });

  // Fetch loan products
  const { data: loanProducts = [] } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch fund sources
  const { data: fundSources = [] } = useQuery({
    queryKey: ['fund-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch client's savings accounts
  const { data: clientSavingsAccounts = [] } = useQuery({
    queryKey: ['client-savings-accounts', preSelectedClientId],
    queryFn: async () => {
      if (!preSelectedClientId) return [];
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('id, account_number, account_balance, is_active, savings_products(name)')
        .eq('client_id', preSelectedClientId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!preSelectedClientId,
  });

  // Watch form fields for calculations
  const requestedAmount = form.watch('requested_amount');
  const requestedTerm = form.watch('requested_term');
  const numberOfInstallments = form.watch('number_of_installments');
  const interestRate = form.watch('interest_rate');
  const calculationMethod = form.watch('calculation_method');
  const firstRepaymentDate = form.watch('first_repayment_date');
  const selectedProduct = loanProducts.find(p => p.id === form.watch('loan_product_id'));

  // Update form when pre-selected product changes
  useEffect(() => {
    if (preSelectedProductId && selectedProduct) {
      form.setValue('loan_product_id', preSelectedProductId);
      form.setValue('interest_rate', selectedProduct.default_nominal_interest_rate || 0);
      form.setValue('calculation_method', selectedProduct.interest_calculation_method || 'flat');
      form.setValue('repayment_frequency', selectedProduct.repayment_frequency || 'monthly');
    }
  }, [preSelectedProductId, selectedProduct, form]);

  // Calculation functions
  const calculateMonthlyPayment = () => {
    if (!requestedAmount || !requestedTerm || !interestRate) return 0;
    
    if (calculationMethod === 'flat') {
      const totalInterest = (requestedAmount * interestRate * requestedTerm) / 100;
      return (requestedAmount + totalInterest) / requestedTerm;
    } else if (calculationMethod === 'reducing_balance') {
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = requestedTerm;
      if (monthlyRate === 0) return requestedAmount / numberOfPayments;
      return requestedAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    return 0;
  };

  const calculateTotalPayment = () => {
    return calculateMonthlyPayment() * requestedTerm;
  };

  const calculateTotalInterest = () => {
    return calculateTotalPayment() - requestedAmount;
  };

  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
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
      console.error('Error submitting loan application:', error);
      toast({
        title: "Error",
        description: "Failed to submit loan application. Please try again.",
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

  const generateRepaymentSchedulePDF = async () => {
    // Dynamic import to avoid bundle size issues
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Loan Repayment Schedule', 20, 20);
    
    // Client and loan details
    doc.setFontSize(12);
    doc.text(`Client: ${selectedClientInfo?.first_name} ${selectedClientInfo?.last_name}`, 20, 40);
    doc.text(`Loan Amount: ${formatCurrency(requestedAmount)}`, 20, 50);
    doc.text(`Interest Rate: ${interestRate}%`, 20, 60);
    doc.text(`Term: ${requestedTerm} months`, 20, 70);
    doc.text(`Monthly Payment: ${formatCurrency(calculateMonthlyPayment())}`, 20, 80);
    
    // Generate schedule data
    const scheduleData = [];
    let remainingBalance = requestedAmount;
    
    for (let i = 1; i <= numberOfInstallments; i++) {
      const monthlyPayment = calculateMonthlyPayment();
      const interestPayment = calculationMethod === 'reducing_balance' 
        ? (remainingBalance * (interestRate / 100 / 12))
        : ((requestedAmount * interestRate * requestedTerm) / 100) / requestedTerm;
      const principalPayment = monthlyPayment - interestPayment;
      
      const dueDate = firstRepaymentDate ? 
        new Date(firstRepaymentDate.getTime() + ((i - 1) * 30 * 24 * 60 * 60 * 1000)) :
        new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000));
      
      scheduleData.push([
        i,
        dueDate.toLocaleDateString(),
        formatCurrency(principalPayment),
        formatCurrency(interestPayment),
        formatCurrency(monthlyPayment),
        formatCurrency(Math.max(0, remainingBalance - principalPayment))
      ]);
      
      remainingBalance -= principalPayment;
    }
    
    // Add table
    autoTable(doc, {
      startY: 90,
      head: [['Payment #', 'Due Date', 'Principal', 'Interest', 'Total Payment', 'Balance']],
      body: scheduleData,
    });
    
    // Save the PDF
    doc.save(`loan-schedule-${selectedClientInfo?.client_number || 'draft'}.pdf`);
  };

  const fillSampleData = () => {
    const sampleData = {
      fund_source_id: fundSources[0]?.id || "",
      requested_amount: 50000,
      requested_term: 12,
      number_of_installments: 12,
      repayment_frequency: "monthly",
      interest_rate: 15,
      calculation_method: "reducing_balance",
      first_repayment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purpose: loanPurposes[0]?.code_value || "",
      collateral_type: collateralTypes[0]?.code_value || "",
      collateral_value: 75000,
      collateral_description: "Vehicle - Toyota Corolla 2018",
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof LoanApplicationFormData, value);
    });
  };

  // Charge management functions
  const addCharge = () => {
    if (newCharge.name && newCharge.amount) {
      const charge = {
        id: Date.now().toString(),
        name: newCharge.name,
        type: newCharge.type,
        amount: parseFloat(newCharge.amount),
        collected_on: newCharge.collected_on,
        due_date: newCharge.due_date,
      };
      setSelectedCharges([...selectedCharges, charge]);
      setNewCharge({
        name: '',
        type: 'Flat',
        amount: '',
        collected_on: 'Specified due date',
        due_date: ''
      });
    }
  };

  const removeCharge = (chargeId: string) => {
    setSelectedCharges(selectedCharges.filter(charge => charge.id !== chargeId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Loan Application
          </DialogTitle>
          <DialogDescription>
            Complete the loan application form with all required information
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="financial">Financial Details</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  {/* Client Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  {selectedClientInfo ? (
                                    <div className="p-3 bg-muted rounded-md">
                                      <div className="font-medium">
                                        {selectedClientInfo.first_name} {selectedClientInfo.last_name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Client #: {selectedClientInfo.client_number}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-muted rounded-md text-muted-foreground">
                                      Please select a client first
                                    </div>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Loan Product Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Loan Product
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="loan_product_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select loan product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loanProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
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
                                  {fundSources.map((fund) => (
                                    <SelectItem key={fund.id} value={fund.id}>
                                      {fund.fund_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Product Details */}
                      {selectedProduct && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <h4 className="font-medium mb-2">Product Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Min Amount:</span>
                              <p className="font-medium">{formatCurrency(selectedProduct.min_principal)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Amount:</span>
                              <p className="font-medium">{formatCurrency(selectedProduct.max_principal)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Interest Rate:</span>
                              <p className="font-medium">{selectedProduct.default_nominal_interest_rate}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Term:</span>
                              <p className="font-medium">{selectedProduct.max_term} months</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Details Tab */}
                <TabsContent value="financial" className="space-y-6">
                  {/* Loan Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Loan Details
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={fillSampleData}>
                          Fill Sample Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="requested_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Requested Amount (KES)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="100000"
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
                              <FormLabel>Loan Term (months)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="12"
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
                          name="number_of_installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Installments</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="12"
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
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
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
                                  placeholder="15.00"
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
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                                      "w-[240px] pl-3 text-left font-normal",
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
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Linked Savings Account */}
                  {clientSavingsAccounts.length > 0 && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-sm">Link Savings Account (Optional)</CardTitle>
                        <CardDescription>
                          Link a savings account for collateral or automated repayments
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
                                    <SelectItem value="no-collateral" disabled>No collateral types configured</SelectItem>
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
                              <FormLabel>Collateral Value (KES)</FormLabel>
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
                            <FormLabel>Collateral Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the collateral in detail..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                                          type: selectedFee.fee_type,
                                          amount: selectedFee.fee_type === 'Flat' ? selectedFee.amount.toString() : selectedFee.percentage_rate?.toString() || '',
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
                                              {charge.fee_type} - {charge.description || 'No description'}
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
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
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

export default FullLoanApplicationDialog;