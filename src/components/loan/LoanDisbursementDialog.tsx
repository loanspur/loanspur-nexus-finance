import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt } from "lucide-react";
import { useProcessLoanDisbursement } from "@/hooks/useLoanManagement";
import { useToast } from "@/hooks/use-toast";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { useFundSources } from "@/hooks/useFundSources";

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
  const processDisbursement = useProcessLoanDisbursement();
  const { data: paymentTypes = [] } = usePaymentTypes();
  const { data: fundSources = [] } = useFundSources();

  // Early return if no loan data
  if (!loanData) {
    return null;
  }

  // Form states
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [selectedSourceAccount, setSelectedSourceAccount] = useState('');

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
      setReceiptNumber('');
      setSelectedPaymentType('');
      setSelectedSourceAccount('');
    }
  }, [open]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDisbursementAmount = () => {
    return loanData.final_approved_amount || loanData.requested_amount || loanData.principal_amount || 0;
  };

  const isFormValid = () => {
    return receiptNumber && selectedPaymentType && selectedSourceAccount;
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
      disbursement_date: new Date().toISOString(),
      payment_type_id: selectedPaymentType,
      source_account_id: selectedSourceAccount,
      reference_number: receiptNumber,
    };

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

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((paymentType) => (
                      <SelectItem key={paymentType.id} value={paymentType.id}>
                        {paymentType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Account */}
              <div className="space-y-2">
                <Label>Source Account</Label>
                <Select value={selectedSourceAccount} onValueChange={setSelectedSourceAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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