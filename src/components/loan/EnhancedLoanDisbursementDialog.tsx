import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, Banknote, PiggyBank, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLoanProducts } from "@/hooks/useSupabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLoanTransactionManager } from "@/hooks/useLoanTransactionManager";

interface EnhancedLoanDisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanData: any;
  onSuccess?: () => void;
}

export const EnhancedLoanDisbursementDialog = ({ 
  open, 
  onOpenChange, 
  loanData, 
  onSuccess 
}: EnhancedLoanDisbursementDialogProps) => {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const { data: loanProducts = [] } = useLoanProducts();
  const transactionManager = useLoanTransactionManager();

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

  // When dialog opens, default date to application/creation date if present
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      const base = getLoanCreationDate();
      setDisbursementDate(base && new Date(base) <= new Date(today) ? base : today);
    }
  }, [open, loanData]);

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

  // Load payment mappings from product_fund_source_mappings with mapped accounting ledgers
  const [paymentOptions, setPaymentOptions] = useState<Array<{ id: string; code: string; name: string; account_id: string; account_name?: string }>>([]);
  useEffect(() => {
    const load = async () => {
      if (!loanData?.loan_product_id) return;
      
      // Get mappings with accounting ledger information
      const { data: mappings } = await supabase
        .from('product_fund_source_mappings')
        .select(`
          channel_id, 
          channel_name, 
          account_id,
          chart_of_accounts!inner(account_name, account_code)
        `)
        .eq('product_id', loanData.loan_product_id)
        .eq('product_type', 'loan');
        
      if (!mappings || mappings.length === 0) { 
        setPaymentOptions([]); 
        return; 
      }
      
      // Get payment types for the mapped channels
      const channelIds = mappings.map(m => m.channel_id);
      const { data: pts } = await supabase
        .from('payment_types')
        .select('*')
        .in('id', channelIds);
        
      // Combine payment types with accounting ledger information
      const options = (pts || [])
        .filter((pt) => typeof pt.code === 'string' && pt.code.trim().length > 0)
        .map((pt) => {
          const mapping = mappings.find(m => m.channel_id === pt.id);
          return {
            id: pt.id,
            code: pt.code.toLowerCase(),
            name: pt.name,
            account_id: mapping?.account_id || '',
            account_name: mapping?.chart_of_accounts?.account_name
          };
        })
        .filter(opt => opt.account_id); // Only include options with valid accounting mapping
        
      setPaymentOptions(options);
    };
    load();
  }, [loanData?.loan_product_id]);

  // Fetch client's savings accounts
  const { data: savingsAccounts = [], isLoading: isLoadingSavings } = useQuery({
    queryKey: ['client-savings-accounts', loanData.client_id],
    queryFn: async () => {
      if (!loanData?.client_id) return [];
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('id, account_number, account_balance, savings_products(name)')
        .eq('client_id', loanData.client_id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!loanData?.client_id && open,
  });

  const getDisbursementAmount = () => {
    return loanData.final_approved_amount || loanData.requested_amount || loanData.principal_amount || 0;
  };

  const getLoanCreationDate = () => {
    const d = loanData?.created_date || loanData?.submitted_on_date || loanData?.created_at;
    return d ? String(d).slice(0, 10) : undefined;
  };

  const getMinDisbursementDate = () => {
    // Allow backdating to the loan application/creation date
    const c = getLoanCreationDate();
    return c || undefined;
  };

  const isFormValid = () => {
    if (disbursementMethod === 'undo') return true;
    if (disbursementMethod === 'savings') {
      const targetSavingsId = loanData?.linked_savings_account_id || selectedSavingsAccount;
      return Boolean(targetSavingsId && disbursementDate);
    }
    return Boolean(receiptNumber && selectedPaymentMapping && disbursementDate);
  };

  const handleSubmit = async () => {
    if (disbursementMethod === 'undo') {
      try {
        await transactionManager.mutateAsync({
          type: 'reversal',
          loan_id: loanData.id,
          amount: 0,
          transaction_date: new Date().toISOString().split('T')[0],
        });
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

    // If disbursing to savings, ensure a savings account is available (linked or selected)
    const targetSavingsIdPre = loanData?.linked_savings_account_id || selectedSavingsAccount;
    if (disbursementMethod === 'savings' && !targetSavingsIdPre) {
      toast({
        title: "Missing savings account",
        description: "Select a savings account or link one to disburse to savings.",
        variant: "destructive"
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const creationMin = getLoanCreationDate();
    if (creationMin && new Date(disbursementDate) < new Date(creationMin)) {
      toast({
        title: "Invalid date",
        description: `Disbursement date must be on or after application date (${creationMin})`,
        variant: "destructive",
      });
      return;
    }
    if (new Date(disbursementDate) > new Date(todayStr)) {
      toast({
        title: "Invalid date",
        description: "Disbursement date cannot be in the future",
        variant: "destructive",
      });
      return;
    }

    const targetSavingsId = loanData?.linked_savings_account_id || selectedSavingsAccount;

    try {
      await transactionManager.mutateAsync({
        type: 'disbursement',
        loan_id: loanData.id,
        amount: getDisbursementAmount(),
        transaction_date: disbursementDate,
        disbursement_method: disbursementMethod === 'savings' ? 'cash' : 'bank_transfer',
        reference_number: disbursementMethod === 'direct' ? receiptNumber : undefined,
        savings_account_id: disbursementMethod === 'savings' && targetSavingsId ? targetSavingsId : undefined
      });

      toast({
        title: "Success",
        description: `${disbursementMethod === 'savings' ? 'Disbursed to savings account' : 'Disbursement processed'} successfully`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process disbursement",
        variant: "destructive"
      });
    }
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
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">You can backdate to the application date; future dates are not allowed.</p>
                </div>

                {/* Receipt Number - show only for direct disbursement */}
                {disbursementMethod === 'direct' && (
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
                )}

                {/* Payment Method from Product Mappings (Direct disbursement only) */}
                {disbursementMethod === 'direct' && (
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={selectedPaymentMapping} 
                      onValueChange={setSelectedPaymentMapping} 
                      disabled={!loanData?.loan_product_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={paymentOptions.length === 0 && loanData?.loan_product_id ? "Loading payment methods..." : "Select payment method"} />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {!loanData?.loan_product_id ? (
                          <SelectItem value="no-product" disabled>No loan product selected</SelectItem>
                        ) : paymentOptions.length === 0 ? (
                          <SelectItem value="loading" disabled>Loading payment methods...</SelectItem>
                        ) : (
                          paymentOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.code}>
                              <div className="flex flex-col">
                                <span className="font-medium">{opt.name}</span>
                                {opt.account_name && (
                                  <span className="text-xs text-muted-foreground">
                                    → {opt.account_name}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Savings Account Selection (for savings disbursement) */}
                {disbursementMethod === 'savings' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Target Savings Account
                    </Label>
                    {loanData?.linked_savings_account_id ? (
                      <div className="p-3 rounded-md bg-muted">
                        <p className="text-sm font-medium">Linked Savings Account</p>
                        <p className="text-xs text-muted-foreground">
                          Funds will be transferred to the linked savings account
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedSavingsAccount} onValueChange={setSelectedSavingsAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select savings account" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-background">
                          {isLoadingSavings ? (
                            <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
                          ) : savingsAccounts.length === 0 ? (
                            <SelectItem value="no-accounts" disabled>No active savings accounts found</SelectItem>
                          ) : (
                            savingsAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{account.account_number}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {account.savings_products?.name} - Balance: {formatAmount(account.account_balance || 0)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmation */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={transactionManager.isPending || !isFormValid()}
              variant={disbursementMethod === 'undo' ? 'destructive' : 'default'}
            >
              {transactionManager.isPending ? "Processing..." : 
                disbursementMethod === 'undo' ? "Undo Disbursement" : "Process Disbursement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};