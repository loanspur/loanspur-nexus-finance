import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  PiggyBank, 
  Calendar, 
  CreditCard,
  Plus,
  Minus,
  ArrowRightLeft,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SavingsTransactionForm } from "@/components/forms/SavingsTransactionForm";
import { TransactionStatement } from "@/components/statements/TransactionStatement";
import { useSavingsAccount } from "@/hooks/useSavingsAccount";

interface SavingsAccount {
  id: string;
  account_number: string;
  account_balance: number;
  available_balance: number;
  interest_earned: number;
  is_active: boolean;
  opened_date: string;
  activated_date?: string;
  savings_product_id?: string;
  clients?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  savings_products?: {
    name: string;
    currency_code: string;
  };
}

interface SavingsAccountDetailsDialogProps {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavingsAccountDetailsDialog = ({ 
  account, 
  open, 
  onOpenChange 
}: SavingsAccountDetailsDialogProps) => {
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'fee_charge'>('deposit');
  const { currency } = useCurrency();
  const { data: liveAccount } = useSavingsAccount(account.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [closeReason, setCloseReason] = useState("");
  const [closeDate, setCloseDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [confirmText, setConfirmText] = useState("");
  const [closing, setClosing] = useState(false);

  const { data: activeLinkedLoans } = useQuery<{ id: string; status: string }[]>({
    queryKey: ['active-linked-loans', account.id],
    queryFn: async (): Promise<{ id: string; status: string }[]> => {
      const { data, error } = await (supabase as any)
        .from('loans' as any)
        .select('id, status')
        .eq('linked_savings_account_id', account.id)
        .eq('status', 'active');
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!account?.id,
    staleTime: 30_000,
  });

  const balanceZero = Number(liveAccount?.account_balance ?? account.account_balance) === 0;
  const hasActiveLinkedLoan = (activeLinkedLoans?.length ?? 0) > 0;
  const isAlreadyClosed = !(liveAccount?.is_active ?? account.is_active);

  const handleCloseAccount = async () => {
    if (closing) return;
    if (!balanceZero) {
      toast({ title: 'Cannot Close Account', description: 'Account balance must be 0.', variant: 'destructive' });
      return;
    }
    if (hasActiveLinkedLoan) {
      toast({ title: 'Linked Active Loan', description: 'Unlink or close the active loan before closing this account.', variant: 'destructive' });
      return;
    }
    if (confirmText !== 'CLOSE SAVINGS' || !closeDate || !closeReason.trim()) return;

    try {
      setClosing(true);
      const { error } = await supabase
        .from('savings_accounts')
        .update({ status: 'closed', is_active: false, closed_date: closeDate, close_reason: closeReason.trim() })
        .eq('id', account.id);
      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['savings-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['savings-account', account.id] }),
        queryClient.invalidateQueries({ queryKey: ['savings-transactions', account.id] }),
      ]);

      toast({ title: 'Savings Account Closed', description: `Account ${account.account_number} has been closed.` });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Closure Failed', description: err?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setClosing(false);
    }
  };
  if (!account) return null;

  const handleDeposit = () => {
    // TODO: Implement deposit functionality
    console.log("Deposit to account:", account.id);
  };

  const handleWithdraw = () => {
    // TODO: Implement withdrawal functionality
    console.log("Withdraw from account:", account.id);
  };

  const handleStatementDownload = () => {
    // TODO: Implement statement download
    console.log("Download statement for account:", account.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Account Details - {account.account_number}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of savings account information and transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-medium">{account.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span>{account.savings_products?.name || 'Unknown Product'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <Badge variant="outline">
                    {currency}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opened Date:</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(account.opened_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions & Statement Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Deposit, withdraw, transfer, or view statements</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
                  <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  <TabsTrigger value="statement">Statement</TabsTrigger>
                  <TabsTrigger value="close" className="text-destructive">Close</TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Post a deposit into this savings account.</p>
                  <Button
                    variant="success"
                    onClick={() => { setSelectedTransactionType('deposit'); setTransactionFormOpen(true); }}
                    disabled={!account.is_active}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Start Deposit
                  </Button>
                </TabsContent>

                <TabsContent value="withdrawal" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Withdraw funds from this savings account.</p>
                  <Button
                    variant="success"
                    onClick={() => { setSelectedTransactionType('withdrawal'); setTransactionFormOpen(true); }}
                    disabled={!account.is_active}
                    className="flex items-center gap-2"
                  >
                    <Minus className="h-4 w-4" /> Start Withdrawal
                  </Button>
                </TabsContent>

                <TabsContent value="transfer" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Transfer to another savings or loan account (same or different client).</p>
                  <Button
                    variant="success"
                    onClick={() => { setSelectedTransactionType('transfer'); setTransactionFormOpen(true); }}
                    disabled={!account.is_active}
                    className="flex items-center gap-2"
                  >
                    <ArrowRightLeft className="h-4 w-4" /> Start Transfer
                  </Button>
                </TabsContent>

                <TabsContent value="statement" className="space-y-4">
                  <TransactionStatement
                    accountId={account.id}
                    accountType="savings"
                    accountNumber={account.account_number}
                    clientName={`${account.clients?.first_name || ''} ${account.clients?.last_name || ''}`.trim()}
                    accountDetails={{ balance: (liveAccount?.account_balance ?? account.account_balance) }}
                  />
                </TabsContent>

                <TabsContent value="close" className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Close Savings Account</AlertTitle>
                    <AlertDescription>
                      This action is irreversible. To confirm, type "CLOSE SAVINGS" in the confirmation box below.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="close-date">Closure Date</Label>
                      <Input id="close-date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-close">Type "CLOSE SAVINGS" to confirm</Label>
                      <Input id="confirm-close" placeholder="CLOSE SAVINGS" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="close-reason">Closure Reason</Label>
                      <Textarea id="close-reason" placeholder="Provide a reason for closing this account" value={closeReason} onChange={(e) => setCloseReason(e.target.value)} />
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    {!balanceZero && (
                      <p className="text-destructive">• Account balance must be 0. Current balance: {(liveAccount?.account_balance ?? account.account_balance)}</p>
                    )}
                    {hasActiveLinkedLoan && (
                      <p className="text-destructive">• This account is linked to an active loan. Unlink or close the loan first.</p>
                    )}
                    {isAlreadyClosed && (
                      <p className="text-muted-foreground">• Account is already closed.</p>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full md:w-auto"
                    disabled={closing || isAlreadyClosed || !balanceZero || hasActiveLinkedLoan || confirmText !== 'CLOSE SAVINGS' || !closeReason.trim() || !closeDate}
                    onClick={handleCloseAccount}
                  >
                    {closing ? 'Closing...' : 'Close Savings Account'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
          <SavingsTransactionForm
            open={transactionFormOpen}
            onOpenChange={setTransactionFormOpen}
            savingsAccount={{
              id: account.id,
              account_balance: (liveAccount?.account_balance ?? account.account_balance),
              savings_product_id: (account as any).savings_product_id as string,
              savings_products: { name: account.savings_products?.name || '' },
              account_number: account.account_number,
            }}
            transactionType={selectedTransactionType}
            onSuccess={() => { /* Queries will refresh via hooks */ }}
          />
      </DialogContent>
    </Dialog>
  );
};