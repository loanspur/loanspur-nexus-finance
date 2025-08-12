import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, ArrowLeft, Banknote, PiggyBank, Undo2 } from "lucide-react";
import { useProcessLoanDisbursement, useUndoLoanDisbursement } from "@/hooks/useLoanManagement";
import { useToast } from "@/hooks/use-toast";
import { useLoanProducts } from "@/hooks/useSupabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useLoanDisbursementAccounting } from "@/hooks/useLoanAccounting";


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
  const undoDisbursement = useUndoLoanDisbursement();
  const { data: loanProducts = [] } = useLoanProducts();
  const accountingDisburse = useLoanDisbursementAccounting();

  // Undo disbursement -> back to approval stage
  const handleUndoApproval = async () => {
    await undoDisbursement.mutateAsync({ loan_application_id: loanData.id });
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
  const [disbursementDate, setDisbursementDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
      setDisbursementDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  // Load payment mappings from product_fund_source_mappings joined with payment_types to get codes
  const [paymentOptions, setPaymentOptions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  useEffect(() => {
    const load = async () => {
      if (!loanData?.loan_product_id) return;
      const { data: mappings } = await supabase
        .from('product_fund_source_mappings')
        .select('channel_id, channel_name')
        .eq('product_id', loanData.loan_product_id)
        .eq('product_type', 'loan');
      const channelIds = (mappings || []).map(m => m.channel_id);
      if (channelIds.length === 0) { setPaymentOptions([]); return; }
      const { data: pts } = await supabase
        .from('payment_types')
        .select('*')
        .in('id', channelIds);
      const options = (pts || [])
        .filter((pt) => typeof pt.code === 'string' && pt.code.trim().length > 0)
        .map((pt) => ({ id: pt.id, code: pt.code.toLowerCase(), name: pt.name }));
      setPaymentOptions(options);
    };
    load();
  }, [loanData?.loan_product_id]);

  // Get client's savings accounts for transfer option
  const getClientSavingsAccounts = () => {
    // This would need to be implemented to fetch client's savings accounts
    // For now returning empty array
    return [];
  };

  const getDisbursementAmount = () => {
    return loanData.final_approved_amount || loanData.requested_amount || loanData.principal_amount || 0;
  };

  const getLoanCreationDate = () => {
    const d = loanData?.created_date || loanData?.submitted_on_date || loanData?.created_at;
    return d ? String(d).slice(0, 10) : undefined;
  };
  const getLoanApprovalDate = () => {
    const d = loanData?.approved_on_date || loanData?.approval_date || loanData?.approved_at;
    return d ? String(d).slice(0, 10) : undefined;
  };
  const getMinDisbursementDate = () => {
    const c = getLoanCreationDate();
    const a = getLoanApprovalDate();
    const candidates = [c, a].filter(Boolean) as string[];
    if (candidates.length === 0) return undefined;
    return candidates.sort()[candidates.length - 1]; // latest of creation/approval
  };

  const isFormValid = () => {
    if (disbursementMethod === 'undo') return true;
    if (disbursementMethod === 'savings') {
      return Boolean(receiptNumber && loanData?.linked_savings_account_id && disbursementDate);
    }
    return Boolean(receiptNumber && selectedPaymentMapping && disbursementDate);
  };
  const handleSubmit = async () => {
    if (disbursementMethod === 'undo') {
      try {
        await handleUndoApproval();
        toast({
          title: "Success",
          description: "Disbursement has been undone and application returned to approval",
        });
        onOpenChange(false);
        onSuccess?.();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to undo disbursement",
          variant: "destructive"
        });
      }
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: disbursementMethod === 'savings'
          ? "Loan must have a linked savings account to disburse to savings"
          : "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // If disbursing to savings, ensure loan is linked to a savings account
    if (disbursementMethod === 'savings' && !loanData?.linked_savings_account_id) {
      toast({
        title: "Missing linked savings",
        description: "This loan is not linked to a savings account. Link one on the loan form to disburse to savings.",
        variant: "destructive"
      });
      return;
    }
    const disbursementDateIso = new Date(disbursementDate + 'T00:00:00').toISOString();

    const creationMin = getLoanCreationDate();
    const approvalMin = getLoanApprovalDate();
    if (creationMin && new Date(disbursementDate) < new Date(creationMin)) {
      toast({
        title: "Invalid date",
        description: `Disbursement date must be on or after loan creation date (${creationMin})`,
        variant: "destructive",
      });
      return;
    }
    if (approvalMin && new Date(disbursementDate) < new Date(approvalMin)) {
      toast({
        title: "Invalid date",
        description: `Disbursement date must be on or after loan approval date (${approvalMin})`,
        variant: "destructive",
      });
      return;
    }

    const disbursementData: any = {
      loan_application_id: loanData.id,
      disbursed_amount: getDisbursementAmount(),
      disbursement_date: disbursementDateIso,
      disbursement_method: disbursementMethod === 'savings' ? 'transfer_to_savings' : (selectedPaymentMapping || 'bank_transfer'),
      reference_number: receiptNumber,
      ...(disbursementMethod === 'savings' && { savings_account_id: loanData.linked_savings_account_id })
    };

    processDisbursement.mutate(disbursementData, {
      onSuccess: async (result: any) => {
        try {
          // Create accounting entry using selected payment method
          if (result?.loan) {
            await accountingDisburse.mutateAsync({
              loan_id: result.loan.id,
              client_id: result.loan.client_id,
              loan_product_id: loanData.loan_product_id,
              principal_amount: getDisbursementAmount(),
              disbursement_date: disbursementDate,
              loan_number: result.loan.loan_number,
              payment_method: disbursementMethod === 'savings' ? undefined : (selectedPaymentMapping || undefined),
            });
          }
        } catch (e: any) {
          console.warn('Accounting for disbursement failed:', e);
        }
        toast({
          title: "Success",
          description: `${disbursementMethod === 'savings' ? 'disbursed to savings account' : 'disbursement processed'} successfully`,
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
                  <span className="text-sm">Undo Disbursement</span>
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
                {/* Disbursement Date */}
                <div className="space-y-2">
                  <Label>Disbursement Date</Label>
                  <Input
                    type="date"
                    value={disbursementDate}
                    min={getMinDisbursementDate()}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                  />
                </div>

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

                {/* Payment Method from Product Mappings (Direct disbursement only) */}
                {disbursementMethod === 'direct' && (
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={selectedPaymentMapping} onValueChange={setSelectedPaymentMapping} disabled={paymentOptions.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {paymentOptions.length === 0 ? (
                          <SelectItem value="no-options" disabled>No mapped payment methods</SelectItem>
                        ) : (
                          paymentOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.code}>
                              {opt.name}
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
                  Undo Disbursement
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