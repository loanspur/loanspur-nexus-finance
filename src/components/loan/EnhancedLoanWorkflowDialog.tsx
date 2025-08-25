import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Clock, Banknote, AlertTriangle, Undo2, RefreshCw, FileText, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProcessLoanApproval, useProcessLoanDisbursement, useUpdateLoanApplicationDetails, useUndoLoanDisbursement } from "@/hooks/useLoanManagement";
import { useMifosIntegration } from "@/hooks/useMifosIntegration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateFeeAmount, formatFeeDisplay } from "@/lib/fee-calculation";
import { NewLoanDialog } from "@/components/client/dialogs/NewLoanDialog";

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes', 'undo_approval']),
  approved_amount: z.string().optional(),
  approved_term: z.string().optional(),
  approved_interest_rate: z.string().optional(),
  approval_date: z.string().min(1, "Approval date is required"),
  conditions: z.string().optional(),
  sync_to_mifos: z.boolean().optional(),
});

const disbursementSchema = z.object({
  disbursement_method: z.enum(['bank_transfer', 'mpesa', 'cash', 'check', 'transfer_to_savings']),
  disbursed_amount: z.string().min(1, "Disbursement amount is required"),
  disbursement_date: z.string().min(1, "Disbursement date is required"),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_name: z.string().optional(),
  mpesa_phone: z.string().optional(),
  savings_account_id: z.string().optional(),
  sync_to_mifos: z.boolean().optional(),
});

const repaymentSchema = z.object({
  payment_amount: z.string().min(1, "Payment amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  reference_number: z.string().optional(),
  sync_to_mifos: z.boolean().optional(),
});

const writeOffSchema = z.object({
  write_off_reason: z.string().min(1, "Write-off reason is required"),
  write_off_date: z.string().min(1, "Write-off date is required"),
  write_off_amount: z.string().min(1, "Write-off amount is required"),
  sync_to_mifos: z.boolean().optional(),
});

type ApprovalData = z.infer<typeof approvalSchema>;
type DisbursementData = z.infer<typeof disbursementSchema>;
type RepaymentData = z.infer<typeof repaymentSchema>;
type WriteOffData = z.infer<typeof writeOffSchema>;

interface EnhancedLoanWorkflowDialogProps {
  loanApplication: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EnhancedLoanWorkflowDialog = ({
  loanApplication,
  open,
  onOpenChange,
  onSuccess
}: EnhancedLoanWorkflowDialogProps) => {
  const [currentTab, setCurrentTab] = useState("details");
  const [modifyOpen, setModifyOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();
  const processApproval = useProcessLoanApproval();
  const processDisbursement = useProcessLoanDisbursement();
  const undoDisbursement = useUndoLoanDisbursement();
  
  // Mifos X integration
  const { 
    mifosConfig, 
    approveMifosLoan, 
    disburseMifosLoan, 
    recordMifosRepayment, 
    writeOffMifosLoan,
    undoMifosDisbursement 
  } = useMifosIntegration();

  // Guard clause to prevent null reference errors
  if (!loanApplication) {
    return null;
  }

  // Fetch client's savings accounts for disbursement to savings
  const { data: savingsAccounts = [] } = useQuery({
    queryKey: ['client-savings-accounts', loanApplication.client_id],
    queryFn: async () => {
      if (!loanApplication.client_id) return [];
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('id, account_number, account_balance, savings_products(name)')
        .eq('client_id', loanApplication.client_id)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!loanApplication.client_id && open,
  });

  // Fetch available loan-related charges/fees
  const { data: availableCharges = [] } = useQuery({
    queryKey: ['available-loan-charges', (profile?.tenant_id || ''), loanApplication.loan_product_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select('id, name, calculation_type, amount, min_amount, max_amount, fee_type, charge_time_type')
        .eq('tenant_id', profile!.tenant_id)
        .eq('fee_type', 'loan')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id && !!loanApplication.loan_product_id && open,
  });

  // Fetch loan product details
  const { data: product } = useQuery({
    queryKey: ['loan-product', loanApplication.loan_product_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanApplication.loan_product_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!loanApplication.loan_product_id && open,
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ['client', loanApplication.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', loanApplication.client_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!loanApplication.client_id && open,
  });

  // Fetch loan details if application is approved
  const { data: loan } = useQuery({
    queryKey: ['loan', loanApplication.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('application_id', loanApplication.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!loanApplication.id && open && ['approved', 'pending_disbursement', 'disbursed', 'active'].includes(loanApplication.status),
  });

  // Fetch loan schedules if loan exists
  const { data: schedules = [] } = useQuery({
    queryKey: ['loan-schedules', loan?.id],
    queryFn: async () => {
      if (!loan?.id) return [];
      const { data, error } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loan.id)
        .order('installment_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id && open,
  });

  // Fetch loan payments if loan exists
  const { data: payments = [] } = useQuery({
    queryKey: ['loan-payments', loan?.id],
    queryFn: async () => {
      if (!loan?.id) return [];
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loan.id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id && open,
  });

  // Calculate outstanding balance
  const outstandingBalance = loan ? (loan.outstanding_balance || 0) : 0;
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0);
  const totalScheduled = schedules.reduce((sum, schedule) => sum + (schedule.total_amount || 0), 0);

  // Form handlers
  const approvalForm = useForm<ApprovalData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      action: 'approve',
      approved_amount: loanApplication.requested_amount?.toString() || '',
      approved_term: loanApplication.requested_term?.toString() || '',
      approved_interest_rate: product?.default_nominal_interest_rate?.toString() || '',
      approval_date: format(new Date(), 'yyyy-MM-dd'),
      conditions: '',
      sync_to_mifos: !!mifosConfig,
    },
  });

  const disbursementForm = useForm<DisbursementData>({
    resolver: zodResolver(disbursementSchema),
    defaultValues: {
      disbursement_method: 'bank_transfer',
      disbursed_amount: loanApplication.requested_amount?.toString() || '',
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
      bank_account_name: '',
      bank_account_number: '',
      bank_name: '',
      mpesa_phone: '',
      savings_account_id: '',
      sync_to_mifos: !!mifosConfig,
    },
  });

  const repaymentForm = useForm<RepaymentData>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      payment_amount: outstandingBalance.toString(),
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      reference_number: '',
      sync_to_mifos: !!mifosConfig,
    },
  });

  const writeOffForm = useForm<WriteOffData>({
    resolver: zodResolver(writeOffSchema),
    defaultValues: {
      write_off_reason: '',
      write_off_date: format(new Date(), 'yyyy-MM-dd'),
      write_off_amount: outstandingBalance.toString(),
      sync_to_mifos: !!mifosConfig,
    },
  });

  // Handle approval submission
const onApprovalSubmit = async (data: ApprovalData) => {
  try {
      // Process local approval
    await processApproval.mutateAsync({
      loan_application_id: loanApplication.id,
      action: data.action,
      approved_amount: data.approved_amount ? parseFloat(data.approved_amount) : undefined,
      approved_term: data.approved_term ? parseInt(data.approved_term) : undefined,
      approved_interest_rate: data.approved_interest_rate ? parseFloat(data.approved_interest_rate) : undefined,
      approval_date: data.approval_date,
      conditions: data.conditions,
    });

      // Sync to Mifos X if enabled and configured
      if (data.sync_to_mifos && mifosConfig && loanApplication.mifos_loan_id && data.action === 'approve') {
        await approveMifosLoan.mutateAsync({
          mifosLoanId: loanApplication.mifos_loan_id,
          approvedOnDate: data.approval_date,
          approvedLoanAmount: data.approved_amount ? parseFloat(data.approved_amount) : undefined,
          expectedDisbursementDate: format(new Date(), 'yyyy-MM-dd'),
        });
      }
    
    onOpenChange(false);
    onSuccess?.();
  } catch (error) {
    console.error('Error processing approval:', error);
  }
};

  // Handle disbursement submission
  const onDisbursementSubmit = async (data: DisbursementData) => {
    try {
      // Process local disbursement
      await processDisbursement.mutateAsync({
        loan_application_id: loanApplication.id,
        disbursed_amount: parseFloat(data.disbursed_amount),
        disbursement_date: data.disbursement_date,
        disbursement_method: data.disbursement_method,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number,
        bank_name: data.bank_name,
        mpesa_phone: data.mpesa_phone,
        savings_account_id: data.savings_account_id,
      });

      // Sync to Mifos X if enabled and configured
      if (data.sync_to_mifos && mifosConfig && loanApplication.mifos_loan_id) {
        await disburseMifosLoan.mutateAsync({
          mifosLoanId: loanApplication.mifos_loan_id,
          disbursementData: {
            transactionDate: data.disbursement_date,
            transactionAmount: parseFloat(data.disbursed_amount),
            paymentTypeId: 1, // Default payment type
            locale: 'en',
            dateFormat: 'yyyy-MM-dd'
          }
        });
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing disbursement:', error);
    }
  };

  // Handle repayment submission
  const onRepaymentSubmit = async (data: RepaymentData) => {
    try {
      if (!loan) {
        toast({
          title: "Error",
          description: "No active loan found for repayment",
          variant: "destructive",
        });
        return;
      }

      // Process local repayment using transaction manager
      // This would need to be implemented in the transaction manager
      // For now, we'll use a direct approach
      const { error } = await supabase
        .from('loan_payments')
        .insert({
          tenant_id: profile?.tenant_id,
          loan_id: loan.id,
          payment_amount: parseFloat(data.payment_amount),
          principal_amount: parseFloat(data.payment_amount), // Simplified allocation
          interest_amount: 0,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          processed_by: profile?.id,
        });

      if (error) throw error;

      // Update loan outstanding balance
      const newOutstanding = Math.max(0, outstandingBalance - parseFloat(data.payment_amount));
      await supabase
        .from('loans')
        .update({ 
          outstanding_balance: newOutstanding,
          status: newOutstanding <= 0 ? 'closed' : 'active'
        })
        .eq('id', loan.id);

      // Sync to Mifos X if enabled and configured
      if (data.sync_to_mifos && mifosConfig && loan.mifos_loan_id) {
        await recordMifosRepayment.mutateAsync({
          mifosLoanId: loan.mifos_loan_id,
          paymentAmount: parseFloat(data.payment_amount),
          paymentDate: data.payment_date,
          paymentTypeId: 1, // Default payment type
          receiptNumber: data.reference_number,
        });
      }

      toast({
        title: "Success",
        description: "Repayment recorded successfully",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing repayment:', error);
      toast({
        title: "Error",
        description: "Failed to process repayment",
        variant: "destructive",
      });
    }
  };

  // Handle write-off submission
  const onWriteOffSubmit = async (data: WriteOffData) => {
    try {
      if (!loan) {
        toast({
          title: "Error",
          description: "No active loan found for write-off",
          variant: "destructive",
        });
        return;
      }

      // Update loan status to written off
      await supabase
        .from('loans')
        .update({ 
          status: 'written_off',
          outstanding_balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id);

      // Sync to Mifos X if enabled and configured
      if (data.sync_to_mifos && mifosConfig && loan.mifos_loan_id) {
        await writeOffMifosLoan.mutateAsync({
          mifosLoanId: loan.mifos_loan_id,
          writeOffReasonId: 1, // Default reason
          writeOffDate: data.write_off_date,
        });
      }

      toast({
        title: "Success",
        description: "Loan written off successfully",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing write-off:', error);
      toast({
        title: "Error",
        description: "Failed to process write-off",
        variant: "destructive",
      });
    }
  };

  // Handle undo disbursement
  const handleUndoDisbursement = async () => {
    try {
      await undoDisbursement.mutateAsync({
        loan_application_id: loanApplication.id
      });

      // Sync to Mifos X if configured
      if (mifosConfig && loanApplication.mifos_loan_id) {
        await undoMifosDisbursement.mutateAsync({
          mifosLoanId: loanApplication.mifos_loan_id,
          transactionDate: format(new Date(), 'yyyy-MM-dd'),
        });
      }

      toast({
        title: "Success",
        description: "Disbursement undone successfully",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error undoing disbursement:', error);
      toast({
        title: "Error",
        description: "Failed to undo disbursement",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
      case 'pending_disbursement':
        return 'default';
      case 'disbursed':
      case 'active':
        return 'default';
      case 'rejected':
      case 'written_off':
        return 'destructive';
      case 'closed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'pending_disbursement':
      case 'disbursed':
      case 'active':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'written_off':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Loan Workflow Management</h2>
              <p className="text-muted-foreground">
                Application #{loanApplication.application_number} - {client?.first_name} {client?.last_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(loanApplication.status)}>
                    {getStatusIcon(loanApplication.status)}
                    {loanApplication.status.replace('_', ' ').toUpperCase()}
                  </Badge>
              {mifosConfig && (
                <Badge variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Mifos X Connected
                </Badge>
              )}
                  </div>
                </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
              <TabsTrigger value="repayment">Repayment</TabsTrigger>
              <TabsTrigger value="writeoff">Write-off</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">{formatAmount(loanApplication.requested_amount)}</span>
                      </div>
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <span>{loanApplication.requested_term} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Purpose:</span>
                      <span>{loanApplication.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span>{product?.name}</span>
                      </div>
              </CardContent>
            </Card>

                {loan && (
            <Card>
              <CardHeader>
                      <CardTitle>Loan Status</CardTitle>
              </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Outstanding:</span>
                        <span className="font-semibold">{formatAmount(outstandingBalance)}</span>
                  </div>
                      <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <span>{formatAmount(totalPaid)}</span>
                  </div>
                      <div className="flex justify-between">
                        <span>Total Scheduled:</span>
                        <span>{formatAmount(totalScheduled)}</span>
                </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={getStatusColor(loan.status)}>
                          {loan.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                  </div>
                    </CardContent>
                  </Card>
                )}
                </div>

              {schedules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Repayment Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {schedules.map((schedule: any) => (
                        <div key={schedule.id} className="flex justify-between items-center p-2 border rounded">
                          <span>Installment {schedule.installment_number}</span>
                          <span>{formatAmount(schedule.total_amount)}</span>
                          <Badge variant={schedule.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {schedule.payment_status}
                          </Badge>
                            </div>
                      ))}
                </div>
              </CardContent>
            </Card>
              )}
          </TabsContent>

            {/* Approval Tab */}
            <TabsContent value="approval">
                  <Card>
<CardHeader>
                  <CardTitle>Loan Approval</CardTitle>
  <CardDescription>
                    Review and approve the loan application
  </CardDescription>
</CardHeader>
                <CardContent>
                  <Form {...approvalForm}>
                    <form onSubmit={approvalForm.handleSubmit(onApprovalSubmit)} className="space-y-4">
                      <FormField
                        control={approvalForm.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="approve">Approve</SelectItem>
                                <SelectItem value="reject">Reject</SelectItem>
                                    <SelectItem value="request_changes">Request Changes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={approvalForm.control}
                          name="approved_amount"
                            render={({ field }) => (
                              <FormItem>
                              <FormLabel>Approved Amount</FormLabel>
                                <FormControl>
                                <Input {...field} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                                <FormField
                                  control={approvalForm.control}
                          name="approved_term"
                                  render={({ field }) => (
                                    <FormItem>
                              <FormLabel>Approved Term (months)</FormLabel>
                                      <FormControl>
                                <Input {...field} type="number" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={approvalForm.control}
                          name="approved_interest_rate"
                                  render={({ field }) => (
                                    <FormItem>
                              <FormLabel>Interest Rate (%)</FormLabel>
                                      <FormControl>
                                <Input {...field} type="number" step="0.01" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                      </div>

                                <FormField
                                  control={approvalForm.control}
                        name="approval_date"
                                  render={({ field }) => (
                                    <FormItem>
                            <FormLabel>Approval Date</FormLabel>
                                      <FormControl>
                              <Input {...field} type="date" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                              <FormField
                                control={approvalForm.control}
                                name="conditions"
                                render={({ field }) => (
                                  <FormItem>
                            <FormLabel>Conditions (optional)</FormLabel>
                                    <FormControl>
                              <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                      {mifosConfig && (
                        <FormField
                          control={approvalForm.control}
                          name="sync_to_mifos"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Sync to Mifos X
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={processApproval.isPending}>
                          {processApproval.isPending ? "Processing..." : "Submit Approval"}
                        </Button>
                      </div>
                </form>
              </Form>
                </CardContent>
              </Card>
          </TabsContent>

            {/* Disbursement Tab */}
            <TabsContent value="disbursement">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Disbursement</CardTitle>
                      <CardDescription>
                    Process loan disbursement
                      </CardDescription>
                    </CardHeader>
                <CardContent>
                  <Form {...disbursementForm}>
                    <form onSubmit={disbursementForm.handleSubmit(onDisbursementSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={disbursementForm.control}
                          name="disbursed_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disbursement Amount</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={disbursementForm.control}
                          name="disbursement_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disbursement Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={disbursementForm.control}
                        name="disbursement_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disbursement Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="transfer_to_savings">Transfer to Savings</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {disbursementForm.watch('disbursement_method') === 'transfer_to_savings' && (
                              <FormField
                                control={disbursementForm.control}
                                name="savings_account_id"
                                render={({ field }) => (
                                  <FormItem>
                              <FormLabel>Savings Account</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select savings account" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                  {savingsAccounts.map((account: any) => (
                                          <SelectItem key={account.id} value={account.id}>
                                      {account.account_number} - {formatAmount(account.account_balance)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                      )}

                      {mifosConfig && (
                        <FormField
                          control={disbursementForm.control}
                          name="sync_to_mifos"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Sync to Mifos X
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={processDisbursement.isPending}>
                          {processDisbursement.isPending ? "Processing..." : "Process Disbursement"}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  {loan && loan.status === 'disbursed' && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Disbursement Actions</h4>
                          <p className="text-sm text-muted-foreground">
                            Loan has been disbursed. You can undo the disbursement if needed.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleUndoDisbursement}
                          disabled={undoDisbursement.isPending}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          {undoDisbursement.isPending ? "Processing..." : "Undo Disbursement"}
                        </Button>
                      </div>
                    </div>
                            )}
                          </CardContent>
                        </Card>
            </TabsContent>

            {/* Repayment Tab */}
            <TabsContent value="repayment">
              <Card>
                          <CardHeader>
                  <CardTitle>Loan Repayment</CardTitle>
                  <CardDescription>
                    Record loan repayment
                  </CardDescription>
                          </CardHeader>
                <CardContent>
                  {loan ? (
                    <Form {...repaymentForm}>
                      <form onSubmit={repaymentForm.handleSubmit(onRepaymentSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                            control={repaymentForm.control}
                            name="payment_amount"
                              render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Amount</FormLabel>
                                  <FormControl>
                                  <Input {...field} type="number" step="0.01" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                            control={repaymentForm.control}
                            name="payment_date"
                              render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Date</FormLabel>
                                  <FormControl>
                                  <Input {...field} type="date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                            <FormField
                          control={repaymentForm.control}
                          name="payment_method"
                              render={({ field }) => (
                                <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                                  <SelectItem value="check">Check</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={repaymentForm.control}
                          name="reference_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Number (optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                        {mifosConfig && (
                          <FormField
                            control={repaymentForm.control}
                            name="sync_to_mifos"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Sync to Mifos X
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Record Repayment
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No active loan found. Please approve and disburse the loan first.
                      </p>
                    </div>
                  )}
                          </CardContent>
                        </Card>
            </TabsContent>

            {/* Write-off Tab */}
            <TabsContent value="writeoff">
              <Card>
                          <CardHeader>
                  <CardTitle>Loan Write-off</CardTitle>
                  <CardDescription>
                    Write off the loan as bad debt
                  </CardDescription>
                          </CardHeader>
                          <CardContent>
                  {loan ? (
                    <Form {...writeOffForm}>
                      <form onSubmit={writeOffForm.handleSubmit(onWriteOffSubmit)} className="space-y-4">
                            <FormField
                          control={writeOffForm.control}
                          name="write_off_reason"
                              render={({ field }) => (
                                <FormItem>
                              <FormLabel>Write-off Reason</FormLabel>
                                  <FormControl>
                                <Textarea {...field} placeholder="Enter reason for write-off" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={writeOffForm.control}
                            name="write_off_amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Write-off Amount</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={writeOffForm.control}
                            name="write_off_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Write-off Date</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {mifosConfig && (
                          <FormField
                            control={writeOffForm.control}
                            name="sync_to_mifos"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Sync to Mifos X
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancel
                        </Button>
                          <Button type="submit" variant="destructive">
                            Write Off Loan
                        </Button>
                      </div>
                </form>
              </Form>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No active loan found. Please approve and disburse the loan first.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Attachments</CardTitle>
                  <CardDescription>
                    Manage loan-related documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-semibold">Application Documents</h4>
                      <p className="text-sm text-muted-foreground">KYC, ID, etc.</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-semibold">Collateral Documents</h4>
                      <p className="text-sm text-muted-foreground">Property, vehicle, etc.</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-semibold">Guarantor Documents</h4>
                      <p className="text-sm text-muted-foreground">Guarantor KYC</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="outline">
                      Upload Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};