import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CheckCircle, PiggyBank } from 'lucide-react';

export const LoanClosureNotification = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('loan-closure-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loans',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        async (payload) => {
          // Check if loan was just closed
          if (payload.new?.status === 'closed' && payload.old?.status !== 'closed') {
            const loanNumber = payload.new.loan_number;
            
            // Check if there's a corresponding overpayment transfer
            const { data: transfer } = await supabase
              .from('transactions')
              .select('amount, description')
              .eq('loan_id', payload.new.id)
              .like('description', '%Overpayment transfer%')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (transfer) {
              // Show overpayment transfer notification
              toast({
                title: "Loan Auto-Closed with Overpayment",
                description: (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">Loan {loanNumber} has been automatically closed.</p>
                      <p className="text-sm text-muted-foreground">
                        Overpayment of {formatAmount(transfer.amount)} has been transferred to the client's savings account.
                      </p>
                    </div>
                  </div>
                ),
                duration: 8000, // Show for 8 seconds
              });
            } else {
              // Show regular loan closure notification
              toast({
                title: "Loan Auto-Closed",
                description: (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Loan {loanNumber} has been automatically closed.</p>
                      <p className="text-sm text-muted-foreground">
                        The loan has been fully paid and closed successfully.
                      </p>
                    </div>
                  </div>
                ),
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, toast, formatAmount]);

  return null; // This component doesn't render anything visible
};