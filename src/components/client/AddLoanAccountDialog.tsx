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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import { isDevelopment, generateSampleLoanData } from "@/lib/dev-utils";
import { SampleDataButton } from "@/components/dev/SampleDataButton";

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

  // Fetch global loan charges
  const { data: feeStructures = [] } = useFeeStructures();
  const loanFeeStructures = feeStructures.filter(fee => fee.fee_type === 'loan' && fee.is_active);

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

  // Dynamic validation schema based on selected product
  const createDynamicSchema = (product?: any) => {
    const baseSchema = addLoanAccountSchema;
    
    if (!product) return baseSchema;

    return baseSchema.extend({
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
    const errors = form.formState.errors;
    
    switch (tab) {
      case "basic":
        return formData.loan_product_id && formData.requested_amount && formData.loan_purpose && formData.fund_id && formData.interest_rate && !errors.loan_product_id && !errors.requested_amount && !errors.loan_purpose && !errors.fund_id && !errors.interest_rate;
      case "terms":
        return formData.expected_disbursement_date && formData.loan_term && formData.number_of_repayments && formData.first_repayment_date && formData.interest_rate && !errors.expected_disbursement_date && !errors.loan_term && !errors.number_of_repayments && !errors.first_repayment_date && !errors.interest_rate;
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
    return isTabValid(currentTab);
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

  // Generate repayment schedule preview
  const generateSchedulePreview = () => {
    const formData = form.getValues();
    if (!formData.requested_amount || !formData.interest_rate || !formData.loan_term || !formData.first_repayment_date) {
      return;
    }

    const principal = parseFloat(formData.requested_amount);
    const annualRate = parseFloat(formData.interest_rate) / 100;
    const monthlyRate = annualRate / 12;
    const termMonths = parseInt(formData.loan_term);
    
    // Calculate fees from selected charges
    const totalFees = loanCharges.reduce((sum, charge) => {
      return sum + (parseFloat(charge.amount) || 0);
    }, 0);
    const monthlyFees = totalFees / termMonths;
    
    // Calculate monthly payment using standard loan formula
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    const schedule = [];
    let remainingBalance = principal;
    let currentDate = new Date(formData.first_repayment_date);

    for (let i = 1; i <= termMonths; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const principalAmount = monthlyPayment - interestAmount;
      remainingBalance -= principalAmount;

      schedule.push({
        installment: i,
        due_date: format(currentDate, "MMM dd, yyyy"),
        principal: principalAmount,
        interest: interestAmount,
        fees: monthlyFees,
        total: monthlyPayment + monthlyFees,
        balance: Math.max(0, remainingBalance)
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

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
                const sampleData = generateSampleLoanData();
                
                // Set form values
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
                              <SelectItem value="" disabled>Loading products...</SelectItem>
                            ) : loanProducts.length === 0 ? (
                              <SelectItem value="" disabled>No active products found</SelectItem>
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
                            <SelectItem value="business_expansion">Business Expansion</SelectItem>
                            <SelectItem value="working_capital">Working Capital</SelectItem>
                            <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                            <SelectItem value="inventory_financing">Inventory Financing</SelectItem>
                            <SelectItem value="education">Education/School Fees</SelectItem>
                            <SelectItem value="home_improvement">Home Improvement</SelectItem>
                            <SelectItem value="medical_expenses">Medical Expenses</SelectItem>
                            <SelectItem value="agriculture">Agriculture/Farming</SelectItem>
                            <SelectItem value="vehicle_purchase">Vehicle Purchase</SelectItem>
                            <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                                <SelectItem value="" disabled>No loan charges configured</SelectItem>
                              ) : (
                                loanFeeStructures.map((fee) => (
                                  <SelectItem key={fee.id} value={fee.id}>
                                    {fee.fee_name} ({fee.calculation_method === 'fixed' ? 
                                      `KES ${fee.fixed_amount}` : 
                                      `${fee.percentage_rate}%`})
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