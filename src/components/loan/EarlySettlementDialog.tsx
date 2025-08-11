
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateFeeAmount, type FeeStructure, type CalculatedFee } from "@/lib/fee-calculation";

interface EarlySettlementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: any;
  onSettlement: (data: any) => void;
}

export const EarlySettlementDialog = ({ isOpen, onClose, loanData, onSettlement }: EarlySettlementDialogProps) => {
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [customFeeAmount, setCustomFeeAmount] = useState("");
  const [availableFees, setAvailableFees] = useState<FeeStructure[]>([]);
  const [calculatedFee, setCalculatedFee] = useState<CalculatedFee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate totals and overpaid amount
  const totalRepaid = (loanData?.loan_payments || []).reduce((sum: number, payment: any) => sum + (payment.payment_amount || 0), 0);
  const totalPrincipal = loanData?.principal_amount || 0;
  const totalInterest = (loanData?.loan_payments || []).reduce((sum: number, payment: any) => sum + (payment.interest_amount || 0), 0);
  const totalFees = (loanData?.loan_payments || []).reduce((sum: number, payment: any) => sum + (payment.fee_amount || 0), 0);
  const totalPenalties = (loanData?.loan_payments || []).reduce((sum: number, payment: any) => sum + (payment.penalty_amount || 0), 0);
  
  const totalOwed = totalPrincipal + totalInterest + totalFees + totalPenalties;
  const overpaidAmount = Math.max(0, totalRepaid - totalOwed);
  
  const outstandingPrincipal = loanData?.outstanding_balance || 0;
  const outstandingInterest = Math.max(0, (loanData?.loan_schedules || [])
    .filter((schedule: any) => schedule.payment_status !== 'paid')
    .reduce((sum: number, schedule: any) => sum + (schedule.interest_amount - (schedule.paid_amount * (schedule.interest_amount / schedule.total_amount) || 0)), 0));

  const totalOutstanding = outstandingPrincipal + outstandingInterest;

  useEffect(() => {
    if (isOpen && loanData?.loan_product_id) {
      fetchLinkedFees();
    }
  }, [isOpen, loanData?.loan_product_id]);

  useEffect(() => {
    if (selectedFeeId) {
      calculateSelectedFee();
    } else {
      setCalculatedFee(null);
    }
  }, [selectedFeeId, totalOutstanding]);

  const fetchLinkedFees = async () => {
    try {
      // First get the loan product with linked fee IDs
      const { data: loanProduct, error: productError } = await supabase
        .from('loan_products')
        .select('linked_fee_ids')
        .eq('id', loanData.loan_product_id)
        .single();

      if (productError) throw productError;

      if (loanProduct?.linked_fee_ids && loanProduct.linked_fee_ids.length > 0) {
        // Fetch the actual fee structures
        const { data: fees, error: feesError } = await supabase
          .from('fee_structures')
          .select('*')
          .in('id', loanProduct.linked_fee_ids)
          .eq('is_active', true)
          .eq('fee_type', 'loan'); // Only loan-related fees

        if (feesError) throw feesError;

        setAvailableFees(fees || []);
      } else {
        setAvailableFees([]);
      }
    } catch (error) {
      console.error('Error fetching linked fees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available fees",
        variant: "destructive",
      });
    }
  };

  const calculateSelectedFee = () => {
    const selectedFee = availableFees.find(fee => fee.id === selectedFeeId);
    if (selectedFee) {
      const calculated = calculateFeeAmount(selectedFee, totalOutstanding);
      setCalculatedFee(calculated);
    }
  };

  const handleSettlement = async () => {
    setIsLoading(true);
    try {
      const settlementFee = calculatedFee ? calculatedFee.calculated_amount : (parseFloat(customFeeAmount) || 0);
      const totalSettlementAmount = totalOutstanding + settlementFee;

      const settlementData = {
        loan_id: loanData.id,
        settlement_date: settlementDate,
        outstanding_principal: outstandingPrincipal,
        outstanding_interest: outstandingInterest,
        settlement_fee: settlementFee,
        total_settlement_amount: totalSettlementAmount,
        overpaid_amount: overpaidAmount,
        fee_structure_id: selectedFeeId || null,
        custom_fee_amount: !selectedFeeId ? parseFloat(customFeeAmount) || 0 : null,
      };

      await onSettlement(settlementData);
      onClose();
    } catch (error) {
      console.error('Settlement error:', error);
      toast({
        title: "Error",
        description: "Failed to process early settlement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const settlementFee = calculatedFee ? calculatedFee.calculated_amount : (parseFloat(customFeeAmount) || 0);
  const totalSettlementAmount = totalOutstanding + settlementFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Early Loan Settlement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Settlement Date */}
          <div>
            <Label htmlFor="settlement-date">Settlement Date</Label>
            <Input
              id="settlement-date"
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
            />
          </div>

          {/* Outstanding Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Outstanding Principal:</span>
                <span className="font-medium">KES {outstandingPrincipal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Interest:</span>
                <span className="font-medium">KES {outstandingInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Outstanding:</span>
                <span>KES {totalOutstanding.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Overpaid Amount */}
          {overpaidAmount > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">Overpaid Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Amount to Refund:</span>
                  <span>KES {overpaidAmount.toLocaleString()}</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Total repaid (KES {totalRepaid.toLocaleString()}) exceeds total owed (KES {totalOwed.toLocaleString()})
                </p>
              </CardContent>
            </Card>
          )}

          {/* Early Settlement Fee */}
          <Card>
            <CardHeader>
              <CardTitle>Early Settlement Fee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fee-select">Select Fee Structure</Label>
                <Select value={selectedFeeId} onValueChange={setSelectedFeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFees.length === 0 ? (
                      <SelectItem value="" disabled>No fees available for this loan product</SelectItem>
                    ) : (
                      availableFees.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} - {fee.calculation_type === 'percentage' ? `${fee.amount}%` : `KES ${fee.amount}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {!selectedFeeId && (
                <div>
                  <Label htmlFor="custom-fee">Custom Fee Amount</Label>
                  <Input
                    id="custom-fee"
                    type="number"
                    placeholder="Enter custom fee amount"
                    value={customFeeAmount}
                    onChange={(e) => setCustomFeeAmount(e.target.value)}
                  />
                </div>
              )}

              {calculatedFee && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Calculated Fee:</span>
                    <span className="font-semibold">KES {calculatedFee.calculated_amount.toLocaleString()}</span>
                  </div>
                  {calculatedFee.applied_limit && (
                    <p className="text-sm text-blue-600 mt-1">
                      {calculatedFee.applied_limit === 'minimum' ? 'Minimum' : 'Maximum'} limit applied
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settlement Total */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700">Settlement Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Outstanding Amount:</span>
                  <span>KES {totalOutstanding.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Fee:</span>
                  <span>KES {settlementFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Settlement:</span>
                  <span>KES {totalSettlementAmount.toLocaleString()}</span>
                </div>
                {overpaidAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Less: Overpaid Amount:</span>
                    <span>-KES {overpaidAmount.toLocaleString()}</span>
                  </div>
                )}
                {overpaidAmount > 0 && (
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Net Amount Due:</span>
                    <span>KES {Math.max(0, totalSettlementAmount - overpaidAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSettlement}
              disabled={isLoading || (totalOutstanding <= 0 && overpaidAmount === 0)}
            >
              {isLoading ? "Processing..." : "Process Settlement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
