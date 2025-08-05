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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Calendar, Percent, FileText, User, Building, Shield, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useMifosIntegration } from "@/hooks/useMifosIntegration";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFundSources } from "@/hooks/useFundSources";
import { useLoanPurposes } from "@/hooks/useLoanPurposes";
import { useCollateralTypes } from "@/hooks/useCollateralTypes";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { FormDescription } from "@/components/ui/form";
import { format } from "date-fns";

const loanApplicationSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  fund_source_id: z.string().min(1, "Please select a fund source"),
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1"),
  term_frequency: z.enum(["daily", "weekly", "monthly", "annually"]),
  purpose: z.string().min(1, "Please select a loan purpose"),
  interest_rate: z.number().min(0, "Interest rate must be positive"),
  interest_calculation_method: z.enum(["flat", "declining_balance"]),
  loan_officer_id: z.string().optional(),
  linked_savings_account_id: z.string().optional(),
  submit_date: z.string(),
  disbursement_date: z.string(),
  product_charges: z.array(z.string()).default([]),
  collateral_ids: z.array(z.string()).default([]),
  collateral_type: z.string().optional(),
  collateral_value: z.number().optional(),
  collateral_description: z.string().optional(),
});

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

interface NewLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const NewLoanDialog = ({ open, onOpenChange, clientId }: NewLoanDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const createLoanApplication = useCreateLoanApplication();
  const { createMifosLoanApplication, mifosConfig, isLoadingConfig } = useMifosIntegration();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  
  // Enhanced charges state
  const [selectedChargeId, setSelectedChargeId] = useState("");
  const [customChargeAmount, setCustomChargeAmount] = useState("");
  const [chargeSearchTerm, setChargeSearchTerm] = useState("");
  const [selectedCharges, setSelectedCharges] = useState<any[]>([]);

  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loan_product_id: "",
      fund_source_id: "",
      requested_amount: 0,
      requested_term: 12,
      term_frequency: "monthly",
      purpose: "",
      interest_rate: 0,
      interest_calculation_method: "declining_balance",
      loan_officer_id: "unassigned",
      linked_savings_account_id: "none",
      submit_date: format(new Date(), 'yyyy-MM-dd'),
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
      product_charges: [],
      collateral_ids: [],
    },
  });

  // Fetch loan products
  const { data: loanProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id && open,
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  // Fetch fund sources
  const { data: fundSources = [], isLoading: isLoadingFunds } = useFundSources();

  // Fetch loan purposes
  const { data: loanPurposes = [], isLoading: isLoadingPurposes } = useLoanPurposes();

  // Fetch collateral types
  const { data: collateralTypes = [], isLoading: isLoadingCollateral } = useCollateralTypes();

  // Fetch fee structures for charges
  const { data: feeStructures = [], isLoading: isLoadingCharges } = useFeeStructures();

  // Fetch loan officers
  const { data: loanOfficers = [] } = useQuery({
    queryKey: ['loan-officers', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', profile?.tenant_id)
        .eq('role', 'loan_officer')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id && open,
  });

  // Fetch client's savings accounts from database
  const { data: savingsAccounts = [] } = useQuery({
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
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Fetch product charges (mock data since table doesn't exist)
  const productCharges = [
    { id: '1', charge_name: 'Processing Fee', charge_amount: 100, charge_type: 'flat' },
    { id: '2', charge_name: 'Insurance Fee', charge_amount: 50, charge_type: 'percentage' },
  ];

  const { currency } = useCurrency();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Helper functions for charges
  const filteredCharges = feeStructures.filter(charge =>
    charge.name.toLowerCase().includes(chargeSearchTerm.toLowerCase())
  );

  const addSelectedCharge = () => {
    if (!selectedChargeId) return;
    
    const charge = feeStructures.find(c => c.id === selectedChargeId);
    if (!charge) return;

    const customAmount = customChargeAmount ? parseFloat(customChargeAmount) : charge.amount;
    const newCharge = {
      ...charge,
      amount: customAmount
    };

    setSelectedCharges([...selectedCharges, newCharge]);
    setSelectedChargeId("");
    setCustomChargeAmount("");
  };

  const removeSelectedCharge = (index: number) => {
    setSelectedCharges(selectedCharges.filter((_, i) => i !== index));
  };

  const getTotalCharges = () => {
    return selectedCharges.reduce((total, charge) => {
      if (charge.calculation_type === 'flat') {
        return total + charge.amount;
      } else {
        // For percentage charges, calculate based on loan amount
        const loanAmount = form.watch('requested_amount') || 0;
        return total + (loanAmount * charge.amount / 100);
      }
    }, 0);
  };

  // Helper for collateral coverage
  const collateralValue = form.watch('collateral_value') || 0;
  const loanAmount = form.watch('requested_amount') || 0;
  const collateralCoverage = loanAmount > 0 ? (collateralValue / loanAmount) * 100 : 0;

  const handleProductSelect = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    setSelectedProduct(product);
    
    if (product) {
      form.setValue('interest_rate', product.default_nominal_interest_rate || 0);
      form.setValue('term_frequency', (product.repayment_frequency || 'monthly') as any);
      form.setValue('requested_term', product.default_term || 12);
      form.setValue('requested_amount', product.default_principal || 0);
    }
  };

  const generateRepaymentSchedule = () => {
    const formData = form.getValues();
    if (!formData.requested_amount || !formData.requested_term || !formData.interest_rate) {
      return [];
    }

    const principal = formData.requested_amount;
    const rate = formData.interest_rate / 100;
    const term = formData.requested_term;
    const frequency = formData.term_frequency;
    
    // Simple calculation - should be enhanced based on actual requirements
    const periodsPerYear = frequency === 'daily' ? 365 : frequency === 'weekly' ? 52 : frequency === 'monthly' ? 12 : 1;
    const periodicRate = rate / periodsPerYear;
    const totalPayments = term;
    
    let schedule = [];
    let balance = principal;
    
    if (formData.interest_calculation_method === 'declining_balance') {
      const monthlyPayment = (principal * periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
                            (Math.pow(1 + periodicRate, totalPayments) - 1);
      
      for (let i = 1; i <= totalPayments; i++) {
        const interestPayment = balance * periodicRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        
        schedule.push({
          period: i,
          beginning_balance: balance + principalPayment,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          ending_balance: Math.max(0, balance),
        });
      }
    } else {
      // Flat rate calculation
      const totalInterest = principal * rate;
      const monthlyPayment = (principal + totalInterest) / totalPayments;
      const monthlyPrincipal = principal / totalPayments;
      const monthlyInterest = totalInterest / totalPayments;
      
      for (let i = 1; i <= totalPayments; i++) {
        balance -= monthlyPrincipal;
        schedule.push({
          period: i,
          beginning_balance: balance + monthlyPrincipal,
          payment: monthlyPayment,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          ending_balance: Math.max(0, balance),
        });
      }
    }
    
    return schedule;
  };

  const updateSchedule = () => {
    const schedule = generateRepaymentSchedule();
    setRepaymentSchedule(schedule);
  };

  const onSubmit = async (data: LoanApplicationData) => {
    try {
      console.log('Creating loan application:', data);
      
      // Create local loan application first
      const localApplication = await createLoanApplication.mutateAsync({
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: data.requested_amount,
        requested_term: data.requested_term,
        purpose: data.purpose || '',
        status: 'pending',
      });

      console.log('Local application created:', localApplication);

      // If Mifos is configured, also create in Mifos X
      if (mifosConfig && client?.mifos_client_id) {
        try {
          console.log('Creating Mifos loan application...');
          
          const mifosLoanData = {
            loanApplicationId: localApplication.id,
            clientMifosId: client.mifos_client_id,
            productMifosId: selectedProduct?.mifos_product_id || 1, // Default to product 1 if not mapped
            principal: data.requested_amount,
            termFrequency: data.requested_term,
            numberOfRepayments: data.requested_term,
            interestRate: data.interest_rate || 10,
            expectedDisbursementDate: new Date().toISOString().split('T')[0],
          };

          const mifosResult = await createMifosLoanApplication.mutateAsync(mifosLoanData);
          console.log('Mifos loan application created:', mifosResult);

          // Log successful Mifos integration
          if (mifosResult?.loanId) {
            console.log('Successfully created loan in Mifos X with ID:', mifosResult.loanId);
          }
        } catch (mifosError) {
          console.error('Failed to create Mifos loan application:', mifosError);
          toast({
            title: "Warning",
            description: "Loan application created locally but failed to sync with Mifos X. You can manually sync later.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Loan application created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating loan application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            New Loan Application
          </DialogTitle>
          <DialogDescription>
            Create a new loan application for {client?.first_name} {client?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Loan Details</TabsTrigger>
                <TabsTrigger value="funding">Funding & Officer</TabsTrigger>
                <TabsTrigger value="charges">Charges & Collateral</TabsTrigger>
                <TabsTrigger value="schedule">Schedule Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Loan Product Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Loan Product
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="loan_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Loan Product *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleProductSelect(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a loan product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProducts ? (
                            <SelectItem value="loading" disabled>Loading products...</SelectItem>
                          ) : loanProducts.length === 0 ? (
                            <SelectItem value="no-products" disabled>No loan products available</SelectItem>
                          ) : (
                            loanProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(product.min_principal)} - {formatCurrency(product.max_principal)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Details */}
                {selectedProduct && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">{selectedProduct.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Principal Range</p>
                          <p className="font-medium text-blue-800">
                            {formatCurrency(selectedProduct.min_principal)} - {formatCurrency(selectedProduct.max_principal)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Interest Rate</p>
                          <p className="font-medium text-blue-800">
                            {selectedProduct.min_nominal_interest_rate}% - {selectedProduct.max_nominal_interest_rate}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Term Range</p>
                          <p className="font-medium text-blue-800">
                            {selectedProduct.min_term} - {selectedProduct.max_term} months
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Repayment</p>
                          <p className="font-medium text-blue-800 capitalize">
                            {selectedProduct.repayment_frequency}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requested_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value));
                              updateSchedule();
                            }}
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
                        <FormLabel>Loan Term *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter term"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value));
                              updateSchedule();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="term_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Frequency *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          updateSchedule();
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
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
                        <FormLabel>Interest Rate (% PA) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Interest rate"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value));
                              updateSchedule();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_calculation_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Calculation</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          updateSchedule();
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select calculation method" />
                            </SelectTrigger>
                          </FormControl>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="declining_balance">Reducing Balance</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Purpose *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPurposes ? (
                              <SelectItem value="loading" disabled>Loading purposes...</SelectItem>
                            ) : loanPurposes.length === 0 ? (
                              <SelectItem value="no-purposes" disabled>No purposes available</SelectItem>
                            ) : (
                              loanPurposes.map((purpose) => (
                                <SelectItem key={purpose.id} value={purpose.code_value}>
                                  {purpose.code_value}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="submit_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submit Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disbursement_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Disbursement Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funding" className="space-y-6">
            {/* Fund Source and Officer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Funding & Officer Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fund_source_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund Source *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fund source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingFunds ? (
                              <SelectItem value="loading" disabled>Loading fund sources...</SelectItem>
                            ) : fundSources.length === 0 ? (
                              <SelectItem value="no-funds" disabled>No fund sources available</SelectItem>
                            ) : (
                              fundSources.map((fund) => (
                                <SelectItem key={fund.id} value={fund.id}>
                                  {fund.name} ({fund.type})
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
                    name="loan_officer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Officer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan officer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">No specific officer</SelectItem>
                            {loanOfficers.map((officer) => (
                              <SelectItem key={officer.id} value={officer.id}>
                                {officer.first_name} {officer.last_name}
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
                    name="linked_savings_account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Savings Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select savings account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No linked account</SelectItem>
                            {savingsAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.savings_products?.name} - {account.account_number} 
                                (Balance: {formatCurrency(account.account_balance || 0)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charges" className="space-y-6">
            {/* Enhanced Product Charges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Product Charges
                </CardTitle>
                <FormDescription>
                  Search and select charges for this loan product
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Charges */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Available Charges</h4>
                    
                    {/* Search Input */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Search charges..."
                        value={chargeSearchTerm}
                        onChange={(e) => setChargeSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Charge Selection */}
                    {isLoadingCharges ? (
                      <p className="text-muted-foreground">Loading charges...</p>
                    ) : (
                      <div className="space-y-2">
                        <FormLabel>Select Charge</FormLabel>
                        <Select onValueChange={(value) => setSelectedChargeId(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a charge" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCharges.map((charge) => (
                              <SelectItem key={charge.id} value={charge.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{charge.name}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {charge.calculation_type === 'flat'
                                      ? formatCurrency(charge.amount) 
                                      : `${charge.amount}%`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Custom Amount Input */}
                    <div className="space-y-2">
                      <FormLabel>Custom Amount (Optional)</FormLabel>
                      <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={customChargeAmount}
                        onChange={(e) => setCustomChargeAmount(e.target.value)}
                      />
                    </div>

                    {/* Add Button */}
                    <Button 
                      type="button" 
                      onClick={addSelectedCharge}
                      disabled={!selectedChargeId}
                      className="w-full"
                    >
                      Add Charge
                    </Button>
                  </div>

                  {/* Selected Charges */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Selected Charges</h4>
                    
                    {selectedCharges.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No charges selected</p>
                    ) : (
                      <div className="space-y-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Charge</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCharges.map((charge, index) => (
                              <TableRow key={index}>
                                <TableCell>{charge.name}</TableCell>
                                <TableCell>
                                  {charge.calculation_type === 'flat' 
                                    ? formatCurrency(charge.amount)
                                    : `${charge.amount}%`}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedCharge(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">Total Charges:</span>
                          <span className="font-bold">{formatCurrency(getTotalCharges())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Collateral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Collateral Information
                </CardTitle>
                <FormDescription>
                  Enter details about the collateral for this loan
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Collateral Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Collateral Details</h4>
                    
                    <FormField
                      control={form.control}
                      name="collateral_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collateral Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select collateral type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {collateralTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.code_value}
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
                      name="collateral_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collateral Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter collateral value"
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
                      name="collateral_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the collateral in detail..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Collateral Analysis */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Collateral Analysis</h4>
                    
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Loan Amount:</span>
                        <span className="font-bold">{formatCurrency(form.watch('requested_amount') || 0)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Collateral Value:</span>
                        <span className="font-bold">{formatCurrency(form.watch('collateral_value') || 0)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Coverage Ratio:</span>
                        <span className={`font-bold ${collateralCoverage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                          {collateralCoverage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="mt-3 p-3 rounded-md bg-background">
                        <p className="text-sm">
                          {collateralCoverage >= 150 && (
                            <span className="text-green-600 font-medium">✓ Excellent coverage - Low risk</span>
                          )}
                          {collateralCoverage >= 100 && collateralCoverage < 150 && (
                            <span className="text-blue-600 font-medium">ℹ Good coverage - Acceptable risk</span>
                          )}
                          {collateralCoverage < 100 && (
                            <span className="text-orange-600 font-medium">⚠ Insufficient coverage - High risk</span>
                          )}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended minimum coverage: 120%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {/* Repayment Schedule Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Repayment Schedule Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {repaymentSchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Fill in loan details to preview repayment schedule</p>
                    <Button type="button" onClick={updateSchedule} className="mt-4">
                      Generate Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-2 text-left">Period</th>
                          <th className="border border-border p-2 text-right">Beginning Balance</th>
                          <th className="border border-border p-2 text-right">Payment</th>
                          <th className="border border-border p-2 text-right">Principal</th>
                          <th className="border border-border p-2 text-right">Interest</th>
                          <th className="border border-border p-2 text-right">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule.slice(0, 10).map((payment) => (
                          <tr key={payment.period} className="hover:bg-muted/50">
                            <td className="border border-border p-2">{payment.period}</td>
                            <td className="border border-border p-2 text-right">
                              {formatCurrency(payment.beginning_balance)}
                            </td>
                            <td className="border border-border p-2 text-right">
                              {formatCurrency(payment.payment)}
                            </td>
                            <td className="border border-border p-2 text-right">
                              {formatCurrency(payment.principal)}
                            </td>
                            <td className="border border-border p-2 text-right">
                              {formatCurrency(payment.interest)}
                            </td>
                            <td className="border border-border p-2 text-right">
                              {formatCurrency(payment.ending_balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {repaymentSchedule.length > 10 && (
                      <p className="text-center text-muted-foreground mt-4">
                        ... and {repaymentSchedule.length - 10} more payments
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setActiveTab("details")}
              disabled={activeTab === "details"}
            >
              Previous
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                const tabs = ["details", "funding", "charges", "schedule"];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                }
              }}
              disabled={activeTab === "schedule"}
            >
              Next
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createLoanApplication.isPending || createMifosLoanApplication.isPending}
            >
              {createLoanApplication.isPending || createMifosLoanApplication.isPending ? 'Creating...' : 'Create Loan Application'}
            </Button>
          </div>
        </div>
      </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};