import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateMonthlyInterest } from "@/lib/interest-calculation";
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CalendarIcon, Calculator, DollarSign, Info, Target } from "lucide-react";

interface LoanDetailsStepProps {
  form: UseFormReturn<any>;
}

export function LoanDetailsStep({ form }: LoanDetailsStepProps) {
  const { profile } = useAuth();
  const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: loanPurposes = [] } = useQuery({
    queryKey: ['loan-purposes', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_purposes')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: loanOfficers = [] } = useQuery({
    queryKey: ['loan-officers', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .in('role', ['loan_officer', 'tenant_admin'])
        .order('first_name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Get client's default loan officer
  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', form.watch('client_id')],
    queryFn: async () => {
      const clientId = form.getValues('client_id');
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('loan_officer_id')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!form.watch('client_id'),
  });

  // Set default loan officer when client changes
  useEffect(() => {
    if (clientInfo?.loan_officer_id && !form.getValues('loan_officer_id')) {
      form.setValue('loan_officer_id', clientInfo.loan_officer_id);
    }
  }, [clientInfo, form]);

  // Watch form values for calculations
  const requestedAmount = form.watch('requested_amount');
  const requestedTerm = form.watch('requested_term');
  const numberOfInstallments = form.watch('number_of_installments');
  const interestRate = form.watch('interest_rate');
  const calculationMethod = form.watch('calculation_method');
  const repaymentFrequency = form.watch('repayment_frequency');
  const firstRepaymentDate = form.watch('first_repayment_date');
  const selectedCharges = form.watch('selected_charges') || [];
  const loanProductId = form.watch('loan_product_id');
  const fundSourceId = form.watch('fund_source_id');

  // Get selected loan product details
  const { data: selectedLoanProduct } = useQuery({
    queryKey: ['loan-product-details', loanProductId],
    queryFn: async () => {
      if (!loanProductId) return null;
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanProductId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!loanProductId,
  });

  // Auto-populate form fields when loan product is selected
  useEffect(() => {
    if (selectedLoanProduct && loanProductId) {
      // Only update if fields are empty to avoid overriding user input
      if (!form.getValues('requested_amount') && selectedLoanProduct.default_principal) {
        form.setValue('requested_amount', selectedLoanProduct.default_principal);
      }
      if (!form.getValues('requested_term') && selectedLoanProduct.default_term) {
        form.setValue('requested_term', selectedLoanProduct.default_term);
        form.setValue('number_of_installments', selectedLoanProduct.default_term);
      }
      if (!form.getValues('interest_rate') && selectedLoanProduct.default_nominal_interest_rate) {
        form.setValue('interest_rate', selectedLoanProduct.default_nominal_interest_rate);
      }
      if (!form.getValues('calculation_method') && selectedLoanProduct.interest_calculation_method) {
        form.setValue('calculation_method', selectedLoanProduct.interest_calculation_method);
      }
      if (!form.getValues('repayment_frequency') && selectedLoanProduct.repayment_frequency) {
        form.setValue('repayment_frequency', selectedLoanProduct.repayment_frequency);
      }
    }
  }, [selectedLoanProduct, loanProductId, form]);

  const { currency } = useCurrency();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateMonthlyPayment = () => {
    if (!requestedAmount || !requestedTerm || !interestRate) return 0;
    
    if (calculationMethod === 'flat') {
      const totalInterest = (requestedAmount * interestRate * requestedTerm) / 100;
      return (requestedAmount + totalInterest) / numberOfInstallments;
    } else if (calculationMethod === 'declining_balance') {
      const monthlyRate = interestRate / 100 / 12;
      const payment = (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) / 
                     (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);
      return payment;
    }
    
    return 0;
  };

  const calculateTotalInterest = () => {
    if (!requestedAmount || !requestedTerm || !interestRate) return 0;
    
    if (calculationMethod === 'flat') {
      return (requestedAmount * interestRate * requestedTerm) / 100;
    } else if (calculationMethod === 'declining_balance') {
      const monthlyPayment = calculateMonthlyPayment();
      return (monthlyPayment * numberOfInstallments) - requestedAmount;
    }
    
    return 0;
  };

  const calculateTotalRepayment = () => {
    return requestedAmount + calculateTotalInterest();
  };

  const generateRepaymentSchedule = () => {
    if (!requestedAmount || !numberOfInstallments || !interestRate) return [];
    
    const schedule: any[] = [];
    const monthlyPayment = calculateMonthlyPayment();
    let outstandingPrincipal = requestedAmount;

    // Determine starting date
    const startDate = firstRepaymentDate ? new Date(firstRepaymentDate) : new Date();

    // Total selected charges (applied at first installment by default)
    const totalSelectedCharges = (selectedCharges || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    
    for (let i = 1; i <= numberOfInstallments; i++) {
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (calculationMethod === 'flat') {
        interestPayment = calculateMonthlyInterest(requestedAmount, interestRate);
        principalPayment = monthlyPayment - interestPayment;
      } else if (calculationMethod === 'declining_balance') {
        interestPayment = calculateMonthlyInterest(outstandingPrincipal, interestRate);
        principalPayment = monthlyPayment - interestPayment;
      }
      
      outstandingPrincipal -= principalPayment;

      // Compute repayment date based on frequency
      let date: Date = new Date(startDate);
      if (repaymentFrequency === 'daily') {
        date = addDays(startDate, i - 1);
      } else if (repaymentFrequency === 'weekly') {
        date = addWeeks(startDate, i - 1);
      } else if (repaymentFrequency === 'monthly') {
        date = addMonths(startDate, i - 1);
      } else if (repaymentFrequency === 'quarterly') {
        date = addMonths(startDate, (i - 1) * 3);
      }

      schedule.push({
        installment: i,
        principalPayment,
        interestPayment,
        chargesPayment: i === 1 ? totalSelectedCharges : 0,
        repaymentDate: date,
        totalPayment: monthlyPayment,
        outstandingPrincipal: Math.max(0, outstandingPrincipal),
      });
    }
    
    return schedule;
  };

  useEffect(() => {
    if (requestedAmount && numberOfInstallments && interestRate) {
      const schedule = generateRepaymentSchedule();
      setRepaymentSchedule(schedule);
    }
  }, [requestedAmount, numberOfInstallments, interestRate, calculationMethod, repaymentFrequency, firstRepaymentDate, selectedCharges]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Loan Details</h3>
        <p className="text-muted-foreground">
          Configure the loan amount, term, interest rate, and repayment schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Loan Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Configuration
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
                      <FormLabel>Loan Term (months) *</FormLabel>
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
                      <FormLabel>Number of Installments *</FormLabel>
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
                  name="interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10.00"
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
                      <FormLabel>Calculation Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
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
                  name="repayment_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repayment Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
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
                          {loanPurposes.length === 0 ? (
                            <SelectItem value="general" disabled>General Purpose</SelectItem>
                          ) : (
                            loanPurposes.map((purpose) => (
                              <SelectItem key={purpose.id} value={purpose.name}>
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
                          {loanOfficers.map((officer) => (
                            <SelectItem key={officer.id} value={officer.id}>
                              {officer.first_name} {officer.last_name} ({officer.role})
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
                  name="first_repayment_date"
                  render={({ field }) => (
                    <FormItem>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calculations and Schedule */}
        <div className="space-y-4">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Principal Amount:</span>
                  <span className="font-semibold">{formatCurrency(requestedAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Interest:</span>
                  <span className="font-semibold">{formatCurrency(calculateTotalInterest())}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Repayment:</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculateTotalRepayment())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Payment:</span>
                  <span className="font-semibold text-lg text-blue-600">{formatCurrency(calculateMonthlyPayment())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repayment Schedule */}
          {repaymentSchedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Repayment Schedule
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSchedule(!showSchedule)}
                  >
                    {showSchedule ? 'Hide' : 'Show'} Schedule
                  </Button>
                </CardTitle>
              </CardHeader>
              {showSchedule && (
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Repayment Date</th>
                          <th className="text-left p-2">Principal</th>
                          <th className="text-left p-2">Interest</th>
                          <th className="text-left p-2">Charges</th>
                          <th className="text-left p-2">Total</th>
                          <th className="text-left p-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule.slice(0, 5).map((payment, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{payment.installment}</td>
                            <td className="p-2">{format(payment.repaymentDate, 'PPP')}</td>
                            <td className="p-2">{formatCurrency(payment.principalPayment)}</td>
                            <td className="p-2">{formatCurrency(payment.interestPayment)}</td>
                            <td className="p-2">{formatCurrency(payment.chargesPayment || 0)}</td>
                            <td className="p-2">{formatCurrency(payment.totalPayment)}</td>
                            <td className="p-2">{formatCurrency(payment.outstandingPrincipal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {repaymentSchedule.length > 5 && (
                      <p className="text-center text-muted-foreground mt-2">
                        ... and {repaymentSchedule.length - 5} more payments
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}