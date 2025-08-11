import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { LoanScheduleTable } from "./LoanScheduleTable";
import { LoanDetails } from "./LoanDetails";
import { EarlySettlementDialog } from "./EarlySettlementDialog";

interface LoanDetailsDialogProps {
  loan: any;
  // Original props
  isOpen?: boolean;
  onClose?: () => void;
  // Backward-compat props used elsewhere
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clientName?: string;
}

export const LoanDetailsDialog = ({ loan, isOpen, onClose, open, onOpenChange, clientName }: LoanDetailsDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loanData, setLoanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [showEarlySettlement, setShowEarlySettlement] = useState(false);

  const dialogOpen = (typeof open === 'boolean' ? open : (typeof isOpen === 'boolean' ? isOpen : false));
  const handleOpenChange = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    else if (!val) onClose?.();
  };
  useEffect(() => {
    if (loan?.id) {
      fetchLoanData();
    }
  }, [loan?.id, isOpen]);

  const fetchLoanData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients!loans_client_id_fkey(
            id,
            first_name,
            last_name,
            client_number,
            phone,
            email
          ),
          loan_products!loans_loan_product_id_fkey(
            id,
            name,
            short_name,
            currency_code,
            default_nominal_interest_rate
          ),
          loan_schedules (
            id,
            installment_number,
            due_date,
            principal_amount,
            interest_amount,
            fee_amount,
            total_amount,
            paid_amount,
            outstanding_amount,
            payment_status
          ),
          loan_payments (
            id,
            payment_amount,
            principal_amount,
            interest_amount,
            fee_amount,
            payment_date,
            payment_method,
            reference_number
          )
        `)
        .eq('id', loan.id)
        .single();

      if (error) throw error;
      setLoanData(data);
    } catch (error: any) {
      console.error("Error fetching loan details:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refetchLoanData = async () => {
    await fetchLoanData();
  };

  const handleEarlySettlement = async (settlementData: any) => {
    try {
      console.log('Processing early settlement:', settlementData);
      
      // Create settlement payment record
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          tenant_id: profile?.tenant_id,
          loan_id: settlementData.loan_id,
          payment_amount: settlementData.total_settlement_amount,
          principal_amount: settlementData.outstanding_principal,
          interest_amount: settlementData.outstanding_interest,
          fee_amount: settlementData.settlement_fee,
          penalty_amount: 0,
          payment_date: settlementData.settlement_date,
          payment_method: 'early_settlement',
          reference_number: `ES-${Date.now()}`,
          processed_by: profile?.id,
          notes: `Early settlement - Net amount: KES ${Math.max(0, settlementData.total_settlement_amount - (settlementData.overpaid_amount || 0)).toLocaleString()}`
        });

      if (paymentError) throw paymentError;

      // Update loan status to closed
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: 'closed',
          outstanding_balance: 0,
          closure_date: settlementData.settlement_date,
          closure_reason: 'early_settlement'
        })
        .eq('id', settlementData.loan_id);

      if (loanError) throw loanError;

      toast({
        title: "Success",
        description: "Early settlement processed successfully",
      });

      // Refresh loan data
      if (loan?.id) {
        await refetchLoanData();
      }
    } catch (error: any) {
      console.error('Early settlement error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process early settlement",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Loan Details...</DialogTitle>
          </DialogHeader>
          <p>Fetching loan data, please wait...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <LoanDetails loanData={loanData} />
          </TabsContent>
          <TabsContent value="schedule">
            <LoanScheduleTable loanSchedules={loanData?.loan_schedules} />
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          
          {loanData?.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => setShowEarlySettlement(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Early Settlement
            </Button>
          )}
        </div>

        {/* Early Settlement Dialog */}
        <EarlySettlementDialog
          isOpen={showEarlySettlement}
          onClose={() => setShowEarlySettlement(false)}
          loanData={loanData}
          onSettlement={handleEarlySettlement}
        />
      </DialogContent>
    </Dialog>
  );
};
