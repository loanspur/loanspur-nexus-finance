import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const allocationSchema = z.object({
  paymentId: z.string().min(1, "Please select a payment"),
  allocationType: z.enum(['loan', 'savings']),
  targetId: z.string().min(1, "Please select target account"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  notes: z.string().optional(),
});

type AllocationFormData = z.infer<typeof allocationSchema>;

interface PaymentAllocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentAllocationForm = ({ open, onOpenChange }: PaymentAllocationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const { toast } = useToast();

  // Mock unallocated payments
  const unallocatedPayments = [
    {
      id: "pay_001",
      amount: 15000,
      paymentType: "mpesa",
      date: "2024-01-15",
      reference: "NLJ7RT61SV",
      payerName: "John Doe",
      payerPhone: "+254712345678"
    },
    {
      id: "pay_002",
      amount: 25000,
      paymentType: "bank_transfer",
      date: "2024-01-14",
      reference: "BT20240114001",
      payerName: "Jane Smith",
      payerPhone: "+254723456789"
    }
  ];

  // Mock loans and savings for allocation
  const loans = [
    { id: "loan_001", clientName: "John Doe", loanNumber: "LN-2024-001", outstandingBalance: 50000 },
    { id: "loan_002", clientName: "Jane Smith", loanNumber: "LN-2024-002", outstandingBalance: 75000 },
  ];

  const savingsAccounts = [
    { id: "sav_001", clientName: "John Doe", accountNumber: "SAV-2024-001", balance: 25000 },
    { id: "sav_002", clientName: "Jane Smith", accountNumber: "SAV-2024-002", balance: 40000 },
  ];

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      allocationType: "loan",
      amount: "",
    },
  });

  const onSubmit = async (data: AllocationFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Allocated",
        description: "The payment has been successfully allocated.",
      });
      
      form.reset();
      setSelectedPayment(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to allocate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSelect = (payment: any) => {
    setSelectedPayment(payment);
    form.setValue("paymentId", payment.id);
    form.setValue("amount", payment.amount.toString());
  };

  const allocationType = form.watch("allocationType");
  const targetAccounts = allocationType === "loan" ? loans : savingsAccounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Allocate Payment</DialogTitle>
          <DialogDescription>
            Manually allocate unallocated payments to specific loans or savings accounts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Unallocated Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unallocated Payments</CardTitle>
              <CardDescription>Select a payment to allocate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unallocatedPayments
                    .filter(payment => 
                      payment.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPayment?.id === payment.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentSelect(payment)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{payment.payerName}</p>
                            <p className="text-sm text-gray-600">{payment.payerPhone}</p>
                            <p className="text-xs text-gray-500">{payment.reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              KSh {payment.amount.toLocaleString()}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {payment.paymentType.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right side - Allocation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allocation Details</CardTitle>
              <CardDescription>Specify where to allocate the payment</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPayment ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">Selected Payment</span>
                      </div>
                      <p className="text-sm">
                        <strong>{selectedPayment.payerName}</strong> - 
                        KSh {selectedPayment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">{selectedPayment.reference}</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="allocationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allocation Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select allocation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="loan">Loan Repayment</SelectItem>
                              <SelectItem value="savings">Savings Deposit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {allocationType === "loan" ? "Select Loan" : "Select Savings Account"}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${allocationType} account`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {targetAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.clientName} - {
                                    allocationType === "loan" 
                                      ? (account as any).loanNumber 
                                      : (account as any).accountNumber
                                  }
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allocation Amount (KSh)</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Allocating..." : "Allocate Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a payment from the left to allocate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};