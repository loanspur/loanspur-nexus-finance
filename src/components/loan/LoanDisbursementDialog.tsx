import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, DollarSign, PiggyBank, CreditCard, Building, Receipt, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProcessLoanDisbursement } from "@/hooks/useLoanManagement";
import { useToast } from "@/hooks/use-toast";

interface LoanDisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanData: any;
  clientSavingsAccounts?: any[];
  onSuccess?: () => void;
}

export const LoanDisbursementDialog = ({ 
  open, 
  onOpenChange, 
  loanData, 
  clientSavingsAccounts = [],
  onSuccess 
}: LoanDisbursementDialogProps) => {
  const { toast } = useToast();
  const processDisbursement = useProcessLoanDisbursement();

  // Form states
  const [disbursementType, setDisbursementType] = useState<'savings' | 'external'>('savings');
  const [disbursementMethod, setDisbursementMethod] = useState<'transfer_to_savings' | 'bank_transfer' | 'mpesa' | 'cash' | 'check'>('transfer_to_savings');
  const [disbursementDate, setDisbursementDate] = useState<Date>(new Date());
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedSavingsAccount, setSelectedSavingsAccount] = useState('');
  
  // External payment fields
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Generate unique receipt number on dialog open
  useEffect(() => {
    if (open && !receiptNumber) {
      const timestamp = Date.now().toString();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      setReceiptNumber(`DISB-${timestamp.slice(-6)}-${randomSuffix}`);
    }
  }, [open, receiptNumber]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setDisbursementType('savings');
      setDisbursementMethod('transfer_to_savings');
      setDisbursementDate(new Date());
      setReceiptNumber('');
      setSelectedSavingsAccount('');
      setBankName('');
      setBankAccountName('');
      setBankAccountNumber('');
      setMpesaPhone('');
      setReferenceNumber('');
    }
  }, [open]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleDisbursementTypeChange = (type: 'savings' | 'external') => {
    setDisbursementType(type);
    if (type === 'savings') {
      setDisbursementMethod('transfer_to_savings');
    } else {
      setDisbursementMethod('bank_transfer');
    }
  };

  const getDisbursementAmount = () => {
    return loanData.final_approved_amount || loanData.requested_amount || loanData.principal_amount || 0;
  };

  const isFormValid = () => {
    if (!disbursementDate || !receiptNumber) return false;
    
    if (disbursementType === 'savings') {
      return selectedSavingsAccount && clientSavingsAccounts.length > 0;
    } else {
      switch (disbursementMethod) {
        case 'bank_transfer':
          return bankName && bankAccountName && bankAccountNumber;
        case 'mpesa':
          return mpesaPhone;
        case 'cash':
        case 'check':
          return true;
        default:
          return false;
      }
    }
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const disbursementData: any = {
      loan_application_id: loanData.id,
      disbursed_amount: getDisbursementAmount(),
      disbursement_date: disbursementDate.toISOString(),
      disbursement_method: disbursementMethod,
      reference_number: receiptNumber,
    };

    // Add method-specific data
    if (disbursementType === 'savings' && selectedSavingsAccount) {
      disbursementData.savings_account_id = selectedSavingsAccount;
    } else if (disbursementMethod === 'bank_transfer') {
      disbursementData.bank_name = bankName;
      disbursementData.bank_account_name = bankAccountName;
      disbursementData.bank_account_number = bankAccountNumber;
    } else if (disbursementMethod === 'mpesa') {
      disbursementData.mpesa_phone = mpesaPhone;
    }

    if (referenceNumber) {
      disbursementData.reference_number = referenceNumber;
    }

    processDisbursement.mutate(disbursementData, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Loan disbursement processed successfully",
        });
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to process disbursement",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Process Loan Disbursement
          </DialogTitle>
          <DialogDescription>
            Disburse funds for {loanData.application_number || loanData.loan_number} - {formatCurrency(getDisbursementAmount())}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disbursement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <div className="font-medium">
                    {loanData.clients?.first_name} {loanData.clients?.last_name}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loan Product</Label>
                  <div className="font-medium">{loanData.loan_products?.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disbursement Amount</Label>
                  <div className="font-bold text-green-600 text-lg">
                    {formatCurrency(getDisbursementAmount())}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Ready for Disbursement
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disbursement Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disbursement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Receipt Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Receipt Number
                </Label>
                <Input
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Unique receipt number"
                  className="font-mono"
                />
              </div>

              {/* Disbursement Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Disbursement Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !disbursementDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {disbursementDate ? format(disbursementDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={disbursementDate}
                      onSelect={(date) => date && setDisbursementDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Separator />

              {/* Disbursement Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Select Disbursement Method</Label>
                <RadioGroup 
                  value={disbursementType} 
                  onValueChange={handleDisbursementTypeChange}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="savings" id="savings" />
                      <Label 
                        htmlFor="savings" 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                        Transfer to Savings
                      </Label>
                    </div>
                    {clientSavingsAccounts.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 ml-6">
                        <AlertCircle className="h-4 w-4" />
                        No active savings accounts found
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="external" id="external" />
                    <Label 
                      htmlFor="external" 
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Building className="h-4 w-4 text-purple-600" />
                      External Payment
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditional Fields Based on Type */}
              {disbursementType === 'savings' && (
                <div className="p-4 border rounded-lg bg-blue-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-blue-600" />
                    <h5 className="font-medium text-blue-900">Savings Account Transfer</h5>
                  </div>
                  
                  {clientSavingsAccounts.length > 0 ? (
                    <>
                      <p className="text-sm text-blue-700">
                        Funds will be transferred to the selected savings account as a deposit transaction.
                      </p>
                      
                      <div className="space-y-2">
                        <Label>Select Savings Account</Label>
                        <Select value={selectedSavingsAccount} onValueChange={setSelectedSavingsAccount}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose savings account" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientSavingsAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_number} - {account.savings_products?.name || 'Savings'} 
                                ({formatCurrency(account.account_balance || 0)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-amber-700">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No active savings accounts available for this client.</p>
                      <p className="text-sm">Please create a savings account first or choose external payment.</p>
                    </div>
                  )}
                </div>
              )}

              {disbursementType === 'external' && (
                <div className="p-4 border rounded-lg bg-purple-50 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <h5 className="font-medium text-purple-900">External Payment Method</h5>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={disbursementMethod} onValueChange={(value) => setDisbursementMethod(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {disbursementMethod === 'bank_transfer' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Holder Name</Label>
                        <Input
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="Enter account holder name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Enter account number"
                        />
                      </div>
                    </div>
                  )}

                  {disbursementMethod === 'mpesa' && (
                    <div className="space-y-2">
                      <Label>M-Pesa Phone Number</Label>
                      <Input
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="+254712345678"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Reference Number (Optional)</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Additional reference number"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid() || processDisbursement.isPending}
              className="flex-1 bg-gradient-primary"
            >
              {processDisbursement.isPending ? (
                "Processing..."
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Disbursement ({formatCurrency(getDisbursementAmount())})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};