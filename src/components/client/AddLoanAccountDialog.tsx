import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, CalendarIcon, Upload, Plus, Trash2, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useLoanPurposes } from "@/hooks/useLoanPurposes";
import { useCollateralTypes } from "@/hooks/useCollateralTypes";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import { isDevelopment, generateSampleLoanData } from "@/lib/dev-utils";
import { SampleDataButton } from "@/components/dev/SampleDataButton";
import { generateLoanSchedule } from "@/lib/loan-schedule-generator";

const addLoanAccountSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.string().min(1, "Loan amount is required"),
  loan_purpose: z.string().min(1, "Loan purpose is required").refine((value) => value !== "no-purposes", "Please select a valid loan purpose"),
  fund_id: z.string().optional(), // Make optional since funds might not be available
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
  const [currentTab, setCurrentTab] = useState("basic");
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
  const { toast } = useToast();
  const { profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();

  const [collateralItems, setCollateralItems] = useState([{ type: "", description: "", value: "" }]);
  const [loanCharges, setLoanCharges] = useState([{ charge_type: "", amount: "" }]);

  // Fetch loan products
  const { data: loanProducts = [], isLoading: isLoadingProducts } = useQuery({
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

  // Fetch loan purposes and collateral types
  const { data: loanPurposes = [] } = useLoanPurposes();
  const { data: collateralTypes = [] } = useCollateralTypes();
  
  // Fetch global loan charges
  const { data: feeStructures = [] } = useFeeStructures();
  const loanFeeStructures = feeStructures.filter(fee => fee.fee_type === 'loan' && fee.is_active);

  // Fetch funds
  const { data: funds = [] } = useQuery({
    queryKey: ['funds', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('fund_name');
      if (error) {
        console.error('Error fetching funds:', error);
        return [];
      }
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch client details for signature section
  const { data: clientDetails } = useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch client's savings accounts
  const { data: clientSavingsAccounts = [] } = useQuery({
    queryKey: ['client-savings-accounts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_products(name)
        `)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Check if product has charges that can be paid by transfer
  const hasTransferCharges = () => {
    const selectedProductId = form?.watch("loan_product_id");
    const selectedProduct = loanProducts.find(p => p.id === selectedProductId);
    if (!selectedProduct) return false;
    return loanFeeStructures.some(fee => 
      fee.charge_payment_by === 'transfer' || fee.charge_payment_by.includes('transfer')
    );
  };

  // Initialize form first
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

  // Get selected product after form is initialized
  const selectedProductId = form.watch("loan_product_id");
  const selectedProduct = loanProducts.find(p => p.id === selectedProductId);
  
  // Watch form fields to trigger re-renders
  const watchedFields = form.watch(["loan_product_id", "requested_amount", "loan_purpose", "fund_id", "interest_rate"]);
  
  console.log('Watched fields changed:', watchedFields);


  // Dynamic validation schema based on selected product
  const createDynamicSchema = (product?: any) => {
    const baseSchema = addLoanAccountSchema;
    
    if (!product) return baseSchema;

    const extendedSchema = baseSchema.extend({
      requested_amount: z.string()
        .min(1, "Loan amount is required")
        .refine((val) => {
          const amount = parseFloat(val);
          return amount >= product.min_principal && amount <= product.max_principal;
        }, `Amount must be between ${product.min_principal?.toLocaleString()} and ${product.max_principal?.toLocaleString()}`),
      
      interest_rate: z.string()
        .min(1, "Interest rate is required")
        .refine((val) => {
          const rate = parseFloat(val);
          return rate >= product.min_nominal_interest_rate && rate <= product.max_nominal_interest_rate;
        }, `Interest rate must be between ${product.min_nominal_interest_rate}% and ${product.max_nominal_interest_rate}%`),
      
      loan_term: z.string()
        .min(1, "Loan term is required")
        .refine((val) => {
          const term = parseInt(val);
          return term >= product.min_term && term <= product.max_term;
        }, `Loan term must be between ${product.min_term} and ${product.max_term} months`),
    });

    // If product has transfer charges, make linked savings account required
    if (hasTransferCharges()) {
      return extendedSchema.extend({
        savings_linkage: z.boolean().refine(val => val === true, {
          message: "Savings account linkage is required for loans with transfer charges"
        }),
        linked_savings_account: z.string().min(1, "Please select a linked savings account")
      });
    }

    return extendedSchema;
  };

  // Auto-populate defaults when product is selected
  const handleProductChange = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    if (product) {
      form.setValue("interest_rate", product.default_nominal_interest_rate?.toString() || "");
      form.setValue("loan_term", product.default_term?.toString() || "");
      form.setValue("requested_amount", product.default_principal?.toString() || "");
      form.setValue("number_of_repayments", product.default_term?.toString() || "");
    }
  };

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

  // Check if current tab is valid
  const isTabValid = (tab: string) => {
    const formData = form.getValues();
    
    switch (tab) {
      case "basic":
        // Basic validation - just check if key fields have values
        const hasBasicFields = !!(formData.loan_product_id && 
                                  formData.requested_amount && 
                                  formData.loan_purpose && 
                                  formData.loan_purpose !== "no-purposes" &&
                                  (formData.fund_id || funds.length === 0)); // Allow if no funds available
        
        // Also check if system codes are available
        const hasSystemCodes = loanPurposes.length > 0;
        
        console.log(`Basic tab validation:`, {
          loan_product_id: formData.loan_product_id,
          requested_amount: formData.requested_amount,
          loan_purpose: formData.loan_purpose,
          fund_id: formData.fund_id,
          funds_available: funds.length,
          has_system_codes: hasSystemCodes,
          result: hasBasicFields && hasSystemCodes
        });
        return hasBasicFields && hasSystemCodes;
      case "terms":
        return !!(formData.expected_disbursement_date && 
                  formData.loan_term && 
                  formData.number_of_repayments && 
                  formData.first_repayment_date);
      case "charges":
        return true; // Optional tab
      case "documents":
        return true; // Optional tab
      default:
        return false;
    }
  };

  // Check if form is fully filled
  const isFormComplete = () => {
    return isTabValid("basic") && isTabValid("terms");
  };

  const canProceedToNext = (currentTab: string) => {
    const result = isTabValid(currentTab);
    console.log(`Can proceed to next from ${currentTab}: ${result}`);
    return result;
  };

  const nextTab = () => {
    const tabs = ["basic", "terms", "charges", "documents"];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1 && canProceedToNext(currentTab)) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = ["basic", "terms", "charges", "documents"];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  // Generate repayment schedule preview using the proper loan schedule generator
  const generateSchedulePreview = () => {
    const formData = form.getValues();
    if (!formData.requested_amount || !formData.interest_rate || !formData.loan_term || !formData.first_repayment_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields: amount, interest rate, term, and first repayment date.",
        variant: "destructive",
      });
      return;
    }

    // Get the selected loan product to determine repayment frequency and calculation method
    const selectedProduct = loanProducts?.find(p => p.id === formData.loan_product_id);
    if (!selectedProduct) {
      toast({
        title: "Missing Product Information",
        description: "Please select a loan product first.",
        variant: "destructive",
      });
      return;
    }

    const principal = parseFloat(formData.requested_amount);
    const annualRate = parseFloat(formData.interest_rate) / 100; // Convert percentage to decimal
    const termMonths = parseInt(formData.loan_term);
    
    // Prepare loan schedule parameters
    const scheduleParams = {
      loanId: 'preview',
      principal,
      interestRate: annualRate, // Already in decimal format
      termMonths: selectedProduct.repayment_frequency === 'daily' ? termMonths : termMonths, // For daily, term is in days
      disbursementDate: format(formData.expected_disbursement_date, 'yyyy-MM-dd'),
      firstPaymentDate: format(formData.first_repayment_date, 'yyyy-MM-dd'),
      repaymentFrequency: (selectedProduct.repayment_frequency || 'monthly') as 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly',
      calculationMethod: (selectedProduct.interest_calculation_method || 'reducing_balance') as 'reducing_balance' | 'flat_rate' | 'declining_balance',
      installmentFees: loanCharges.map(charge => ({
        name: charge.charge_type,
        amount: parseFloat(charge.amount) || 0,
        charge_time_type: 'installment'
      }))
    };

    console.log('Generating schedule with params:', scheduleParams);

    // Generate the schedule using the proper library function
    const generatedSchedule = generateLoanSchedule(scheduleParams);
    
    // Convert to the format expected by the UI
    const schedule = generatedSchedule.map((entry, index) => ({
      installment: entry.installment_number,
      due_date: format(new Date(entry.due_date), "MMM dd, yyyy"),
      principal: entry.principal_amount,
      interest: entry.interest_amount,
      fees: entry.fee_amount,
      total: entry.total_amount,
      balance: index === generatedSchedule.length - 1 ? 0 : 
        generatedSchedule.slice(index + 1).reduce((sum, future) => sum + future.principal_amount, 0)
    }));

    console.log('Generated schedule preview:', schedule);

    setRepaymentSchedule(schedule);
    setShowSchedulePreview(true);
  };

  // Download repayment schedule as PDF
  const downloadSchedulePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Add title
    pdf.setFontSize(16);
    pdf.text('LOAN REPAYMENT SCHEDULE', pageWidth / 2, 20, { align: 'center' });
    
    // Add client details
    pdf.setFontSize(12);
    const clientInfo = [
      `Client Name: ${clientDetails?.first_name} ${clientDetails?.last_name}`,
      `Client Number: ${clientDetails?.client_number}`,
      `National ID: ${clientDetails?.national_id || 'N/A'}`,
      `Phone: ${clientDetails?.phone || 'N/A'}`,
      `Email: ${clientDetails?.email || 'N/A'}`,
      `Address: ${clientDetails?.address ? JSON.stringify(clientDetails.address) : 'N/A'}`,
    ];
    
    let yPosition = 35;
    clientInfo.forEach(info => {
      pdf.text(info, 20, yPosition);
      yPosition += 6;
    });
    
    // Add loan details
    const formData = form.getValues();
    const loanInfo = [
      `Loan Product: ${selectedProduct?.name || 'N/A'}`,
      `Loan Amount: KES ${parseFloat(formData.requested_amount).toLocaleString()}`,
      `Interest Rate: ${formData.interest_rate}% p.a.`,
      `Loan Term: ${formData.loan_term} months`,
      `Purpose: ${formData.loan_purpose}`,
    ];
    
    yPosition += 10;
    loanInfo.forEach(info => {
      pdf.text(info, 20, yPosition);
      yPosition += 6;
    });
    
    // Add repayment schedule table
    const tableData = repaymentSchedule.map(payment => [
      payment.installment.toString(),
      payment.due_date,
      payment.principal.toFixed(2),
      payment.interest.toFixed(2),
      payment.fees.toFixed(2),
      payment.total.toFixed(2),
      payment.balance.toFixed(2)
    ]);
    
    autoTable(pdf, {
      startY: yPosition + 10,
      head: [['#', 'Due Date', 'Principal', 'Interest', 'Fees', 'Total Payment', 'Balance']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Add signature section
    const finalY = (pdf as any).lastAutoTable.finalY + 20;
    pdf.setFontSize(12);
    pdf.text('CLIENT ACKNOWLEDGMENT & SIGNATURE', 20, finalY);
    pdf.setFontSize(10);
    pdf.text('I acknowledge that I have read and understood the terms of this loan repayment schedule.', 20, finalY + 10);
    pdf.text('I agree to make payments as outlined above and understand the consequences of default.', 20, finalY + 18);
    
    // Signature lines
    pdf.line(20, finalY + 40, 100, finalY + 40);
    pdf.text('Client Signature', 20, finalY + 48);
    pdf.text(`Date: ${format(new Date(), 'PPP')}`, 20, finalY + 56);
    
    pdf.line(120, finalY + 40, 200, finalY + 40);
    pdf.text('Loan Officer Signature', 120, finalY + 48);
    pdf.text(`Date: ${format(new Date(), 'PPP')}`, 120, finalY + 56);
    
    // Save the PDF
    pdf.save(`${clientName}_loan_schedule_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const onSubmit = async (data: AddLoanAccountData) => {
    // Validate that system codes are configured
    if (loanPurposes.length === 0) {
      toast({
        title: "System Codes Not Configured",
        description: "Please configure loan purposes in System Codes before creating loans.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const loanApplicationData = {
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: parseFloat(data.requested_amount),
        requested_term: parseInt(data.loan_term),
        purpose: data.loan_purpose,
        status: 'pending' as const
      };

      await createLoanApplication.mutateAsync(loanApplicationData);

      form.reset();
      setCollateralItems([{ type: "", description: "", value: "" }]);
      setLoanCharges([{ charge_type: "", amount: "" }]);
      setShowSchedulePreview(false);
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
          {isDevelopment() && (
            <SampleDataButton
              onFillSampleData={() => {
                const sampleData = generateSampleLoanData(loanProducts);
                
                // Set form values
                form.setValue("loan_product_id", sampleData.loan_product_id);
                form.setValue("requested_amount", sampleData.requested_amount);
                form.setValue("loan_purpose", sampleData.loan_purpose);
                form.setValue("fund_id", sampleData.fund_id);
                form.setValue("expected_disbursement_date", sampleData.expected_disbursement_date);
                form.setValue("savings_linkage", sampleData.savings_linkage);
                form.setValue("linked_savings_account", sampleData.linked_savings_account);
                form.setValue("loan_term", sampleData.loan_term);
                form.setValue("number_of_repayments", sampleData.number_of_repayments);
                form.setValue("first_repayment_date", sampleData.first_repayment_date);
                form.setValue("interest_rate", sampleData.interest_rate);
                form.setValue("loan_charges", sampleData.loan_charges);
                form.setValue("collateral_items", sampleData.collateral_items);
                form.setValue("required_documents", sampleData.required_documents);
                
                // Update local state
                setLoanCharges(sampleData.loan_charges);
                setCollateralItems(sampleData.collateral_items);
                
                // Trigger the product change handler if product is selected
                if (sampleData.loan_product_id) {
                  handleProductChange(sampleData.loan_product_id);
                }
              }}
            />
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" disabled={false}>Basic Details</TabsTrigger>
                <TabsTrigger value="terms" disabled={!isTabValid("basic")}>Loan Terms</TabsTrigger>
                <TabsTrigger value="charges" disabled={!isTabValid("basic") || !isTabValid("terms")}>Charges & Collateral</TabsTrigger>
                <TabsTrigger value="documents" disabled={!isTabValid("basic") || !isTabValid("terms")}>Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loan_product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Product *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleProductChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a loan product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingProducts ? (
                              <SelectItem value="loading" disabled>Loading products...</SelectItem>
                            ) : loanProducts.length === 0 ? (
                              <SelectItem value="no-products" disabled>No active products found</SelectItem>
                            ) : (
                              loanProducts.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.min_nominal_interest_rate}% - {product.max_nominal_interest_rate}% p.a.)
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {selectedProduct && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Amount: {selectedProduct.min_principal?.toLocaleString()} - {selectedProduct.max_principal?.toLocaleString()} | 
                            Term: {selectedProduct.min_term} - {selectedProduct.max_term} months
                          </p>
                        )}
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
                          {funds.length > 0 ? (
                            funds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id}>
                                {fund.fund_name} ({fund.fund_code}) - Balance: {fund.current_balance?.toLocaleString() || '0'}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="default" disabled>
                              No funds available
                            </SelectItem>
                          )}
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
                        <FormLabel>Requested Amount ({selectedProduct?.currency_code || 'KES'}) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={selectedProduct ? 
                              `Min: ${selectedProduct.min_principal?.toLocaleString()}, Max: ${selectedProduct.max_principal?.toLocaleString()}` : 
                              "e.g. 100000"
                            }
                            min={selectedProduct?.min_principal || 0}
                            max={selectedProduct?.max_principal || undefined}
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
                            placeholder={selectedProduct ? 
                              `Min: ${selectedProduct.min_nominal_interest_rate}%, Max: ${selectedProduct.max_nominal_interest_rate}%` : 
                              "e.g. 12.5"
                            }
                            min={selectedProduct?.min_nominal_interest_rate || 0}
                            max={selectedProduct?.max_nominal_interest_rate || undefined}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loanPurposes.length === 0 ? (
                              <SelectItem value="no-purposes" disabled>
                                No loan purposes configured. Please configure system codes first.
                              </SelectItem>
                            ) : (
                              loanPurposes.map((purpose) => (
                                <SelectItem key={purpose.id} value={purpose.code_value}>
                                  {purpose.name}
                                  {purpose.description && ` - ${purpose.description}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {loanPurposes.length === 0 && (
                          <p className="text-xs text-destructive mt-1">
                            ⚠️ No loan purposes configured. Please go to Settings → System Codes and add values for "Loan Purposes" before creating loans.
                          </p>
                        )}
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
                          <FormLabel>
                            Link to Savings Account
                            {hasTransferCharges() && <span className="text-red-500 ml-1">*</span>}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {hasTransferCharges() ? 
                              "Required: This loan has charges that can be paid by transfer" :
                              "Link this loan to an existing savings account for automatic deductions"
                            }
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {(form.watch("savings_linkage") || hasTransferCharges()) && (
                    <FormField
                      control={form.control}
                      name="linked_savings_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Linked Savings Account
                            {hasTransferCharges() && <span className="text-red-500 ml-1">*</span>}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select savings account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientSavingsAccounts.length === 0 ? (
                                <SelectItem value="no-accounts" disabled>
                                  No active savings accounts found
                                </SelectItem>
                              ) : (
                                clientSavingsAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.savings_products?.name || 'Unknown Product'} - {account.account_number} 
                                    (Balance: KES {account.account_balance?.toLocaleString() || '0'})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {hasTransferCharges() && (
                            <p className="text-xs text-orange-600 mt-1">
                              Required: This loan has charges that can be paid by transfer
                            </p>
                          )}
                          {clientSavingsAccounts.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              No active savings accounts available. Create a savings account first.
                            </p>
                          )}
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
                            {selectedProduct ? (
                              // Generate options based on product min/max terms
                              Array.from({ length: Math.floor((selectedProduct.max_term - selectedProduct.min_term) / 6) + 1 }, (_, i) => {
                                const term = selectedProduct.min_term + (i * 6);
                                return term <= selectedProduct.max_term ? (
                                  <SelectItem key={term} value={term.toString()}>
                                    {term} months
                                  </SelectItem>
                                ) : null;
                              }).filter(Boolean)
                            ) : (
                              // Default options if no product selected
                              <>
                                <SelectItem value="3">3 months</SelectItem>
                                <SelectItem value="6">6 months</SelectItem>
                                <SelectItem value="12">12 months</SelectItem>
                                <SelectItem value="18">18 months</SelectItem>
                                <SelectItem value="24">24 months</SelectItem>
                                <SelectItem value="36">36 months</SelectItem>
                                <SelectItem value="48">48 months</SelectItem>
                                <SelectItem value="60">60 months</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {selectedProduct && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Allowed range: {selectedProduct.min_term} - {selectedProduct.max_term} months
                          </p>
                        )}
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
                              {loanFeeStructures.length === 0 ? (
                                <SelectItem value="no-charges" disabled>No loan charges configured</SelectItem>
                              ) : (
                                 loanFeeStructures.map((fee) => (
                                   <SelectItem key={fee.id} value={fee.id}>
                                     {fee.name} ({fee.calculation_type === 'fixed' ? 
                                        `KES ${fee.amount}` : 
                                        `${fee.amount}%`})
                                   </SelectItem>
                                 ))
                              )}
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
                            {collateralTypes.length === 0 ? (
                              <SelectItem value="no-collateral" disabled>
                                No collateral types configured. Please configure system codes first.
                              </SelectItem>
                            ) : (
                              collateralTypes.map((type) => (
                                <SelectItem key={type.id} value={type.code_value}>
                                  {type.name}
                                  {type.description && ` - ${type.description}`}
                                </SelectItem>
                              ))
                            )}
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
              
              {isFormComplete() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSchedulePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Schedule
                </Button>
              )}

              {currentTab === "basic" && !canProceedToNext("basic") && (
                <Button type="button" disabled>
                  Next
                </Button>
              )}
              
              {currentTab === "basic" && canProceedToNext("basic") && (
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              )}
              
              {currentTab === "terms" && (
                <>
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                  {canProceedToNext("terms") ? (
                    <Button type="button" onClick={nextTab}>
                      Next
                    </Button>
                  ) : (
                    <Button type="button" disabled>
                      Next
                    </Button>
                  )}
                </>
              )}
              
              {(currentTab === "charges" || currentTab === "documents") && (
                <>
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                  {isFormComplete() ? (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Application..." : "Create Loan Application"}
                    </Button>
                  ) : (
                    <Button type="button" disabled>
                      Complete Required Fields
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Schedule Preview Dialog */}
            {showSchedulePreview && (
              <Dialog open={showSchedulePreview} onOpenChange={setShowSchedulePreview}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Repayment Schedule Preview</DialogTitle>
                    <DialogDescription>
                      Preview of monthly repayments for {clientName}'s loan application
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="overflow-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Installment</TableHead>
                           <TableHead>Due Date</TableHead>
                           <TableHead className="text-right">Principal (KES)</TableHead>
                           <TableHead className="text-right">Interest (KES)</TableHead>
                           <TableHead className="text-right">Fees (KES)</TableHead>
                           <TableHead className="text-right">Total Payment (KES)</TableHead>
                           <TableHead className="text-right">Balance (KES)</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {repaymentSchedule.map((payment) => (
                           <TableRow key={payment.installment}>
                             <TableCell>{payment.installment}</TableCell>
                             <TableCell>{payment.due_date}</TableCell>
                             <TableCell className="text-right">
                               {payment.principal.toLocaleString('en-KE', { 
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2 
                               })}
                             </TableCell>
                             <TableCell className="text-right">
                               {payment.interest.toLocaleString('en-KE', { 
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2 
                               })}
                             </TableCell>
                             <TableCell className="text-right">
                               {payment.fees.toLocaleString('en-KE', { 
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2 
                               })}
                             </TableCell>
                             <TableCell className="text-right">
                               {payment.total.toLocaleString('en-KE', { 
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2 
                               })}
                             </TableCell>
                             <TableCell className="text-right">
                               {payment.balance.toLocaleString('en-KE', { 
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2 
                               })}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                  </div>
                  
                   <div className="flex justify-end gap-2 pt-4">
                     <Button variant="outline" onClick={() => setShowSchedulePreview(false)}>
                       Close Preview
                     </Button>
                     <Button onClick={downloadSchedulePDF} className="flex items-center gap-2">
                       <Download className="h-4 w-4" />
                       Download PDF
                     </Button>
                   </div>
                </DialogContent>
              </Dialog>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};