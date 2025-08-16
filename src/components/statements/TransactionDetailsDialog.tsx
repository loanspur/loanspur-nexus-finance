import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    date: string;
    type: string;
    amount: number;
    balance: number;
    method?: string;
    reference: string;
    description?: string;
    status?: string;
    principalAmount?: number;
    interestAmount?: number;
    feeAmount?: number;
    penaltyAmount?: number;
    paymentId?: string;
  };
}

export const TransactionDetailsDialog = ({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsDialogProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, MMMM dd, yyyy 'at' h:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const hasBreakdown = transaction.principalAmount !== undefined || 
                      transaction.interestAmount !== undefined || 
                      transaction.feeAmount !== undefined || 
                      transaction.penaltyAmount !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            <Badge variant={getStatusColor(transaction.status || 'completed')}>
              {transaction.status || 'Completed'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatDate(transaction.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-sm font-semibold">{transaction.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-sm font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Method</p>
              <p className="text-sm">{transaction.method || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reference</p>
              <p className="text-sm font-mono text-xs">{transaction.reference}</p>
            </div>
          </div>

          {transaction.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}

          {/* Payment Breakdown for Loan Repayments */}
          {hasBreakdown && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Payment Allocation</p>
                <div className="space-y-2">
                  {(transaction.principalAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Principal</span>
                      <span className="text-sm font-medium">{formatCurrency(transaction.principalAmount || 0)}</span>
                    </div>
                  )}
                  {(transaction.interestAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Interest</span>
                      <span className="text-sm font-medium">{formatCurrency(transaction.interestAmount || 0)}</span>
                    </div>
                  )}
                  {(transaction.feeAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Fees</span>
                      <span className="text-sm font-medium">{formatCurrency(transaction.feeAmount || 0)}</span>
                    </div>
                  )}
                  {(transaction.penaltyAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Penalties</span>
                      <span className="text-sm font-medium">{formatCurrency(transaction.penaltyAmount || 0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center py-1 font-semibold">
                    <span className="text-sm">Total Payment</span>
                    <span className="text-sm">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Account Balance After Transaction */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Balance After Transaction</p>
            <p className="text-lg font-semibold">{formatCurrency(transaction.balance)}</p>
          </div>

          {transaction.paymentId && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
              <p className="text-xs font-mono">{transaction.paymentId}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};