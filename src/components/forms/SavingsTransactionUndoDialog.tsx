import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSavingsTransactionUndo, type SavingsTransactionUndoData } from "@/hooks/useSavingsTransactionUndo";
import { AlertTriangle } from "lucide-react";

interface SavingsTransactionUndoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    savings_account_id: string;
    amount: number;
    transaction_type: string;
    reference_number?: string;
    transaction_date: string;
  };
}

export const SavingsTransactionUndoDialog = ({
  open,
  onOpenChange,
  transaction,
}: SavingsTransactionUndoDialogProps) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const undoMutation = useSavingsTransactionUndo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      return;
    }

    const undoData: SavingsTransactionUndoData = {
      transactionId: transaction.id,
      savingsAccountId: transaction.savings_account_id,
      reason,
      notes: notes || undefined,
    };

    try {
      await undoMutation.mutateAsync(undoData);
      onOpenChange(false);
      setReason("");
      setNotes("");
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reverse Savings Transaction
          </DialogTitle>
          <DialogDescription>
            This will reverse the {transaction.transaction_type} transaction of{" "}
            {formatCurrency(transaction.amount)} and update all related journal entries.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reversal *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incorrect_amount">Incorrect Amount</SelectItem>
                <SelectItem value="duplicate_transaction">Duplicate Transaction</SelectItem>
                <SelectItem value="wrong_account">Wrong Account</SelectItem>
                <SelectItem value="client_request">Client Request</SelectItem>
                <SelectItem value="system_error">System Error</SelectItem>
                <SelectItem value="data_correction">Data Correction</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide additional details about the reversal..."
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={undoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason || undoMutation.isPending}
            >
              {undoMutation.isPending ? "Reversing..." : "Reverse Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};