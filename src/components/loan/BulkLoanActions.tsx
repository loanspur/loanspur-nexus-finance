import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, 
  CreditCard, 
  XCircle, 
  AlertTriangle,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedLoanManagement } from "@/hooks/useUnifiedLoanManagement";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UnifiedStatusBadge } from "@/components/ui/unified-status-badge";

interface BulkLoanActionsProps {
  loans: any[];
  actionType: 'approve' | 'disburse';
  onSuccess?: () => void;
}

export const BulkLoanActions = ({ loans, actionType, onSuccess }: BulkLoanActionsProps) => {
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { useProcessLoanApproval, useProcessLoanTransaction } = useUnifiedLoanManagement();
  const processApproval = useProcessLoanApproval();
  const processDisbursement = useProcessLoanTransaction();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLoans(loans.map(loan => loan.id));
    } else {
      setSelectedLoans([]);
    }
  };

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    if (checked) {
      setSelectedLoans(prev => [...prev, loanId]);
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId));
    }
  };

  const handleBulkAction = async () => {
    if (selectedLoans.length === 0) {
      toast({
        title: "No loans selected",
        description: "Please select at least one loan to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const loanId of selectedLoans) {
        try {
          if (actionType === 'approve') {
            await processApproval.mutateAsync({
              loan_application_id: loanId,
              action: 'approve',
              approved_amount: loans.find(l => l.id === loanId)?.requested_amount,
              approved_term: loans.find(l => l.id === loanId)?.requested_term,
              approved_interest_rate: loans.find(l => l.id === loanId)?.loan_products?.default_nominal_interest_rate,
              conditions: "Bulk approval processed"
            });
            successCount++;
          } else if (actionType === 'disburse') {
            await processDisbursement.mutateAsync({
              loan_application_id: loanId,
              disbursed_amount: loans.find(l => l.id === loanId)?.final_approved_amount || loans.find(l => l.id === loanId)?.requested_amount,
              disbursement_date: new Date().toISOString().split('T')[0],
              disbursement_method: 'bank_transfer'
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to process loan ${loanId}:`, error);
          failCount++;
        }
      }

      toast({
        title: `Bulk ${actionType} completed`,
        description: `Successfully processed ${successCount} loans. ${failCount > 0 ? `${failCount} failed.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      setSelectedLoans([]);
      onSuccess?.();
    } catch (error) {
      toast({
        title: `Bulk ${actionType} failed`,
        description: "An error occurred while processing the loans.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const totalSelectedAmount = selectedLoans.reduce((total, loanId) => {
    const loan = loans.find(l => l.id === loanId);
    return total + (loan?.requested_amount || 0);
  }, 0);

  const getActionIcon = () => {
    return actionType === 'approve' ? 
      <CheckCircle className="h-4 w-4" /> : 
      <CreditCard className="h-4 w-4" />;
  };

  const getActionColor = () => {
    return actionType === 'approve' ? 'default' as const : 'default' as const;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk {actionType === 'approve' ? 'Approval' : 'Disbursement'}
          {selectedLoans.length > 0 && (
            <Badge variant="secondary">
              {selectedLoans.length} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        {selectedLoans.length > 0 && (
          <div className="p-4 bg-accent rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Selected Loans: {selectedLoans.length}</p>
                <p className="text-sm text-muted-foreground">
                  Total Amount: {formatCurrency(totalSelectedAmount)}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={getActionColor()} 
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {getActionIcon()}
                    {actionType === 'approve' ? 'Bulk Approve' : 'Bulk Disburse'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Confirm Bulk {actionType === 'approve' ? 'Approval' : 'Disbursement'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to {actionType} {selectedLoans.length} loans with a total amount of {formatCurrency(totalSelectedAmount)}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkAction}>
                      Confirm {actionType === 'approve' ? 'Approval' : 'Disbursement'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Loan List */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedLoans.length === loans.length && loans.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({loans.length} loans)
            </label>
          </div>
          
          {loans.map((loan) => (
            <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedLoans.includes(loan.id)}
                  onCheckedChange={(checked) => handleSelectLoan(loan.id, !!checked)}
                />
                <div>
                  <p className="font-medium">{loan.application_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {loan.clients?.first_name} {loan.clients?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(loan.requested_amount)}</p>
                  <p className="text-sm text-muted-foreground">{loan.requested_term} months</p>
                </div>
                <UnifiedStatusBadge entity={loan} entityType="loan" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};