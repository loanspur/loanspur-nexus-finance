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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const calculatorSchema = z.object({
  principal: z.number().min(1, "Principal amount must be greater than 0"),
  interestRate: z.number().min(0, "Interest rate must be non-negative"),
  termMonths: z.number().min(1, "Term must be at least 1 month"),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface LoanCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanData?: {
    amount: number;
    interestRate: number;
    termMonths: number;
  };
}

export const LoanCalculatorDialog = ({ 
  open, 
  onOpenChange, 
  loanData 
}: LoanCalculatorDialogProps) => {
  const [results, setResults] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: loanData ? {
      principal: loanData.amount,
      interestRate: loanData.interestRate,
      termMonths: loanData.termMonths,
    } : {
      principal: 100000,
      interestRate: 12,
      termMonths: 12,
    },
  });

  const watchedValues = watch();

  const calculateLoan = (data: CalculatorFormData) => {
    const { principal, interestRate, termMonths } = data;
    const monthlyRate = interestRate / 100 / 12;
    
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                      (Math.pow(1 + monthlyRate, termMonths) - 1);
    }
    
    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - principal;

    // Calculate amortization schedule
    const schedule = [];
    let remainingBalance = principal;
    
    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      
      schedule.push({
        month,
        monthlyPayment,
        principalPayment,
        interestPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
    }

    setResults({
      monthlyPayment,
      totalPayment,
      totalInterest,
      schedule: schedule.slice(0, 6), // Show first 6 months
    });
  };

const { formatAmount: formatCurrency } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Loan Payment Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate monthly payments and view amortization schedule
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(calculateLoan)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount (KES)</Label>
                  <Input
                    id="principal"
                    type="number"
                    step="1000"
                    {...register("principal", { valueAsNumber: true })}
                    className={errors.principal ? "border-red-500" : ""}
                  />
                  {errors.principal && (
                    <p className="text-sm text-red-500">{errors.principal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    {...register("interestRate", { valueAsNumber: true })}
                    className={errors.interestRate ? "border-red-500" : ""}
                  />
                  {errors.interestRate && (
                    <p className="text-sm text-red-500">{errors.interestRate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termMonths">Loan Term (Months)</Label>
                  <Input
                    id="termMonths"
                    type="number"
                    step="1"
                    {...register("termMonths", { valueAsNumber: true })}
                    className={errors.termMonths ? "border-red-500" : ""}
                  />
                  {errors.termMonths && (
                    <p className="text-sm text-red-500">{errors.termMonths.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Monthly Payment</span>
                      </div>
                      <div className="text-xl font-bold text-blue-900">
                        {formatCurrency(results.monthlyPayment)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-green-700">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Payment</span>
                      </div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(results.totalPayment)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-orange-700">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Interest</span>
                      </div>
                      <div className="text-xl font-bold text-orange-900">
                        {formatCurrency(results.totalInterest)}
                      </div>
                    </div>
                  </div>

                  {/* Amortization Schedule Preview */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Payment Schedule (First 6 Months)</h4>
                    <div className="space-y-2">
                      {results.schedule.map((payment: any) => (
                        <div key={payment.month} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>Month {payment.month}</span>
                          <span className="font-medium">{formatCurrency(payment.monthlyPayment)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Enter loan parameters and click calculate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};