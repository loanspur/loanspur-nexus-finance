import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, ArrowLeft, Banknote, PiggyBank, Undo2 } from "lucide-react";
import { useProcessLoanDisbursement } from "@/hooks/useLoanManagement";
import { useToast } from "@/hooks/use-toast";
import { useLoanProducts } from "@/hooks/useSupabase";
import { useCurrency } from "@/contexts/CurrencyContext";

interface LoanDisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanData: any;
  onSuccess?: () => void;
}

export const LoanDisbursementDialog = ({ 
  open, 
  onOpenChange, 
  loanData, 
  onSuccess 
}: LoanDisbursementDialogProps) => {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const processDisbursement = useProcessLoanDisbursement();
  const { data: loanProducts = [] } = useLoanProducts();

  // Create a simple undo approval function for now
  const handleUndoApproval = async () => {
    // This would call the actual undo approval API
    throw new Error("Undo approval functionality needs to be implemented");
  };

  // Early return if no loan data
  if (!loanData) {
    return null;
  }

  // Form states
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedPaymentMapping, setSelectedPaymentMapping] = useState('');
  const [disbursementMethod, setDisbursementMethod] = useState<'direct' | 'savings' | 'undo'>('direct');
  const [selectedSavingsAccount, setSelectedSavingsAccount] = useState('');

  // Generate unique receipt number on dialog open
  useEffect(() => {
    if (open && !receiptNumber) {
      const timestamp = Date.now().toString();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      setReceiptNumber(`DISB-${timestamp}-${randomSuffix}`);
    }
  }, [open, receiptNumber]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setReceiptNumber('');
      setSelectedPaymentMapping('');
      setDisbursementMethod('direct');
      setSelectedSavingsAccount('');
    }
  }, [open]);

  // Get loan product payment mappings
  const getLoanProduct = () => {
    return loanProducts.find(p => p.id === loanData?.loan_product_id);
  };

  const getPaymentMappings = () => {
    const product = getLoanProduct();
    // For now return default payment methods until we implement the mappings properly
    return [
      { paymentType: 'Bank Transfer', payment_type: 'Bank Transfer' },
      { paymentType: 'Cash', payment_type: 'Cash' },
      { paymentType: 'M-Pesa', payment_type: 'M-Pesa' },
      { paymentType: 'Check', payment_type: 'Check' }
    ];
  };

  // Get client's savings accounts for transfer option
  const getClientSavingsAccounts = () => {
    // This would need to be implemented to fetch client's savings accounts
    // For now returning empty array
    return [];
  };

  const getDisbursementAmount = () => {
    return loanData.final_approved_amount || loanData.requested_amount || loanData.principal_amount || 0;
  };

  const isFormValid = () => {
    if (disbursementMethod === 'undo') return true;
    if (disbursementMethod === 'savings') {
      return receiptNumber && selectedPaymentMapping && selectedSavingsAccount;
    }
    return receiptNumber && selectedPaymentMapping;
  };

  const handleSubmit = async () => {
    if (disbursementMethod === 'undo') {
      try {
        await handleUndoApproval();
        toast({
          title: "Success",
          description: "Loan approval has been undone successfully",
        });
        onOpenChange(false);
        onSuccess?.();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to undo approval",
          variant: "destructive"
        });
      }
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: disbursementMethod === 'savings' 
          ? "Please fill in all required fields and select a savings account"
          : "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if disbursing to savings but no savings account selected
    if (disbursementMethod === 'savings' && !selectedSavingsAccount) {
      toast({
        title: "Validation Error",
        description: "Please select a savings account for disbursement",
        variant: "destructive"
      });
      return;
    }

    const disbursementData: any = {
      loan_application_id: loanData.id,
      disbursed_amount: getDisbursementAmount(),
      disbursement_date: new Date().toISOString(),
      disbursement_method: disbursementMethod === 'savings' ? 'transfer_to_savings' : 'bank_transfer',
      reference_number: receiptNumber,
      ...(disbursementMethod === 'savings' && { savings_account_id: selectedSavingsAccount })
    };

    processDisbursement.mutate(disbursementData, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Loan ${disbursementMethod === 'savings' ? 'disbursed to savings account' : 'disbursement processed'} successfully`,
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
            Disburse funds for {loanData.application_number || loanData.loan_number} - {formatAmount(getDisbursementAmount())}
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
                    {loanData.clients?.first_name || loanData.client?.first_name || 'N/A'} {loanData.clients?.last_name || loanData.client?.last_name || ''}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loan Product</Label>
                  <div className="font-medium">{loanData.loan_products?.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disbursement Amount</Label>
                  <div className="font-bold text-green-600 text-lg">
                    {formatAmount(getDisbursementAmount())}
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

          {/* Disbursement Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disbursement Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={disbursementMethod === 'direct' ? 'default' : 'outline'}
                  onClick={() => setDisbursementMethod('direct')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-sm">Direct Disbursement</span>
                </Button>
                <Button
                  variant={disbursementMethod === 'savings' ? 'default' : 'outline'}
                  onClick={() => setDisbursementMethod('savings')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <PiggyBank className="h-5 w-5" />
                  <span className="text-sm">Disburse to Savings</span>
                </Button>
                <Button
                  variant={disbursementMethod === 'undo' ? 'destructive' : 'outline'}
                  onClick={() => setDisbursementMethod('undo')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Undo2 className="h-5 w-5" />
                  <span className="text-sm">Undo Approval</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disbursement Details Form - Only show if not undoing approval */}
          {disbursementMethod !== 'undo' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Disbursement Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Receipt Number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Receipt Number (Unique)
                  </Label>
                  <Input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Unique receipt number"
                    className="font-mono"
                  />
                </div>

                {/* Payment Method from Product Mappings */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={selectedPaymentMapping} onValueChange={setSelectedPaymentMapping}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPaymentMappings().map((mapping: any, index: number) => (
                        <SelectItem key={index} value={mapping.paymentType || mapping.payment_type}>
                          {mapping.paymentType || mapping.payment_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Savings Account Selection - Only show if disbursing to savings */}
                {disbursementMethod === 'savings' && (
                  <div className="space-y-2">
                    <Label>Savings Account</Label>
                    <Select value={selectedSavingsAccount} onValueChange={setSelectedSavingsAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select savings account" />
                      </SelectTrigger>
                      <SelectContent>
                        {getClientSavingsAccounts().length === 0 ? (
                          <SelectItem value="" disabled>
                            No savings accounts found. Client must have a savings account.
                          </SelectItem>
                        ) : (
                          getClientSavingsAccounts().map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_number} - {account.account_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid() || processDisbursement.isPending}
              className={`flex-1 ${disbursementMethod === 'undo' ? 'bg-destructive hover:bg-destructive/90' : 'bg-gradient-primary'}`}
            >
              {processDisbursement.isPending ? (
                "Processing..."
              ) : disbursementMethod === 'undo' ? (
                <>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo Approval
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {disbursementMethod === 'savings' ? 'Transfer to Savings' : 'Process Disbursement'} ({formatAmount(getDisbursementAmount())})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};