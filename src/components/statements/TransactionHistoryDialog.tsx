import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionStatement } from "./TransactionStatement";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savingsAccount: {
    id: string;
    account_number: string;
    account_balance: number;
    savings_products?: {
      name: string;
      nominal_annual_interest_rate?: number;
    };
    created_at: string;
  };
  clientName: string;
}

export const TransactionHistoryDialog = ({
  open,
  onOpenChange,
  savingsAccount,
  clientName,
}: TransactionHistoryDialogProps) => {
  if (!savingsAccount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
          <DialogDescription>
            {savingsAccount.savings_products?.name || 'Savings Account'} - {savingsAccount.account_number}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <TransactionStatement
            accountId={savingsAccount.id}
            accountType="savings"
            accountNumber={savingsAccount.account_number}
            clientName={clientName}
            accountDetails={{
              balance: savingsAccount.account_balance,
              interestRate: savingsAccount.savings_products?.nominal_annual_interest_rate,
              openingDate: savingsAccount.created_at,
            }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};