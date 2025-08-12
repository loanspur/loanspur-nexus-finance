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
import { CheckCircle, XCircle, Clock, Banknote, AlertTriangle, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProcessLoanApproval, useProcessLoanDisbursement, useUpdateLoanApplicationDetails } from "@/hooks/useLoanManagement";
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
});

type ApprovalData = z.infer<typeof approvalSchema>;
type DisbursementData = z.infer<typeof disbursementSchema>;

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
        .eq('is_active', true);
      if (error) throw error;
      // Prefer fees that are for loans
      return (data || []).filter((f: any) => (f.fee_type || '').toLowerCase().includes('loan'));
    },
    enabled: !!profile?.tenant_id && open,
  });

  // Local edit state
  const [editTerm, setEditTerm] = useState<number | undefined>(loanApplication.requested_term);
  const [editSavingsId, setEditSavingsId] = useState<string | undefined>(loanApplication.linked_savings_account_id || undefined);
  const [editCharges, setEditCharges] = useState<any[]>(loanApplication.selected_charges || []);
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [customChargeAmount, setCustomChargeAmount] = useState<string>('');

  const updateLoan = useUpdateLoanApplicationDetails();

  const approvalForm = useForm<ApprovalData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      action: 'approve',
      approved_amount: loanApplication.requested_amount?.toString(),
      approved_term: loanApplication.requested_term?.toString(),
      approved_interest_rate: loanApplication.requested_interest_rate?.toString() || loanApplication.loan_products?.default_nominal_interest_rate?.toString(),
      approval_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const disbursementForm = useForm<DisbursementData>({
    resolver: zodResolver(disbursementSchema),
    defaultValues: {
      disbursement_method: 'mpesa',
      disbursed_amount: loanApplication.final_approved_amount?.toString() || loanApplication.requested_amount?.toString(),
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Fetch related client and product if not embedded
  const { data: fallbackClient } = useQuery({
    queryKey: ['loan-client', loanApplication.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name,last_name,client_number,phone,email')
        .eq('id', loanApplication.client_id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !loanApplication.clients && !!loanApplication.client_id && open,
  });

  const { data: fallbackProduct } = useQuery({
    queryKey: ['loan-product', loanApplication.loan_product_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('name,short_name,currency_code,default_nominal_interest_rate,repayment_frequency')
        .eq('id', loanApplication.loan_product_id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!loanApplication.loan_product_id && open && (!loanApplication.loan_products || !loanApplication.loan_products.repayment_frequency),
  });

  const displayClient = loanApplication.clients || fallbackClient || {};
  const displayProduct = loanApplication.loan_products || fallbackProduct || ({} as any);

  const productRepaymentFrequency = loanApplication.loan_products?.repayment_frequency ?? fallbackProduct?.repayment_frequency;
  const frequency = (loanApplication.term_frequency || loanApplication.repayment_frequency || productRepaymentFrequency || 'monthly') as string;
  const termUnit = ((): string => {
    const f = (frequency || '').toString().toLowerCase().replace(/[-_]/g, '');
    if (f.includes('day')) return 'days'; // day, days, daily
    if (f.includes('week')) return 'weeks'; // week, weekly, biweekly -> still show weeks
    if (f.includes('fortnight')) return 'fortnights';
    if (f.includes('month')) return 'months';
    if (f.includes('quarter')) return 'quarters';
    if (f.includes('year') || f.includes('annual')) return 'years';
    return 'months';
  })();

  const displayInterestRate = loanApplication.interest_rate ?? loanApplication.requested_interest_rate ?? displayProduct?.default_nominal_interest_rate;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
      case 'pending_disbursement':
        return 'default';
      case 'disbursed':
        return 'default';
      case 'rejected':
        return 'destructive';
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
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

const onApprovalSubmit = async (data: ApprovalData) => {
  try {
    await processApproval.mutateAsync({
      loan_application_id: loanApplication.id,
      action: data.action,
      approved_amount: data.approved_amount ? parseFloat(data.approved_amount) : undefined,
      approved_term: data.approved_term ? parseInt(data.approved_term) : undefined,
      approved_interest_rate: data.approved_interest_rate ? parseFloat(data.approved_interest_rate) : undefined,
      approval_date: data.approval_date,
      conditions: data.conditions,
    });
    
    onOpenChange(false);
    onSuccess?.();
  } catch (error) {
    console.error('Error processing approval:', error);
  }
};

  const onDisbursementSubmit = async (data: DisbursementData) => {
    try {
      // Validate savings account if disbursing to savings
      if (data.disbursement_method === 'transfer_to_savings' && !data.savings_account_id) {
        toast({
          title: "Validation Error",
          description: "Please select a savings account for transfer",
          variant: "destructive",
        });
        return;
      }

      // Check if client has savings account when disbursing to savings
      if (data.disbursement_method === 'transfer_to_savings' && savingsAccounts.length === 0) {
        toast({
          title: "Disbursement Error",
          description: "Client does not have an active savings account. Please create one first or choose a different disbursement method.",
          variant: "destructive",
        });
        return;
      }

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
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing disbursement:', error);
    }
  };

  const canApprove = ['pending', 'under_review'].includes(loanApplication.status);
  const canDisburse = ['pending_disbursement', 'approved'].includes(loanApplication.status);
  const canUndoApproval = loanApplication.status === 'pending_disbursement' || loanApplication.status === 'approved';
  const isCompleted = loanApplication.status === 'disbursed';

   const activeStage = (loanApplication.status === 'pending' || loanApplication.status === 'under_review')
     ? 'details'
     : (canUndoApproval ? 'approve' : (canDisburse ? 'disburse' : 'details'));

  useEffect(() => {
    if (open) {
      setCurrentTab(activeStage);
    }
  }, [open, activeStage, loanApplication.status]);

  const currentAction = approvalForm.watch('action');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="w-full flex gap-2">
              <TabsTrigger value="details">Application Details</TabsTrigger>
              <TabsTrigger value="edit" disabled={isCompleted}>Update/Modify</TabsTrigger>
              {(canApprove || canUndoApproval || isCompleted) && (
                <TabsTrigger value="approve" disabled={!canApprove && !canUndoApproval && !isCompleted}>
                  {canApprove ? 'Approval' : canUndoApproval ? 'Approved' : 'Approved'}
                </TabsTrigger>
              )}
              {(canDisburse || isCompleted) && (
                <TabsTrigger value="disburse" disabled={!canDisburse && !isCompleted}>
                  {canDisburse ? 'Disbursement' : 'Disbursed'}
                </TabsTrigger>
              )}
            </TabsList>


          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Application Details
                  <Badge variant={getStatusColor(loanApplication.status)} className="flex items-center gap-1">
                    {getStatusIcon(loanApplication.status)}
                    {loanApplication.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(canApprove || canUndoApproval) && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setModifyOpen(true)}
                      disabled={isCompleted}
                    >
                      Update/Modify
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setCurrentTab('approve'); approvalForm.setValue('action', 'approve'); }}
                      disabled={!canApprove && !canUndoApproval}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => { setCurrentTab('approve'); approvalForm.setValue('action', 'reject'); }}
                      disabled={!canApprove}
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {/* Client & Product Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Client Information</h4>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {displayClient?.first_name} {displayClient?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Client: {displayClient?.client_number}
                        </div>
                        {displayClient?.phone && (
                          <div className="text-xs text-muted-foreground">
                            Phone: {displayClient?.phone}
                          </div>
                        )}
                        {displayClient?.email && (
                          <div className="text-xs text-muted-foreground">
                            Email: {displayClient?.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Loan Product</h4>
                      <div className="space-y-1">
                        <div className="font-medium">{displayProduct?.name}</div>
                        {displayProduct?.short_name && (
                          <div className="text-xs text-muted-foreground">
                            Code: {displayProduct?.short_name}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Currency: {displayProduct?.currency_code || 'KES'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Request Details */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Loan Request Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Requested Amount</span>
                      <div className="font-medium text-lg text-primary">
                        {formatAmount(loanApplication.requested_amount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Requested Term</span>
                      <div className="font-medium text-lg">{loanApplication.requested_term} {termUnit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Interest Rate</span>
                      <div className="font-medium text-lg">
                        {displayInterestRate ?? 'TBD'}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval/Processing History */}
                {(loanApplication.reviewed_by || loanApplication.approved_by) && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Processing History</h4>
                    <div className="space-y-2 text-sm">
                      {loanApplication.reviewed_by && (
                        <div className="flex justify-between">
                          <span>Reviewed by:</span>
                          <span className="font-medium">{loanApplication.reviewed_by_name || 'Staff Member'}</span>
                        </div>
                      )}
                      {loanApplication.reviewed_at && (
                        <div className="flex justify-between">
                          <span>Reviewed on:</span>
                          <span className="font-medium">{format(new Date(loanApplication.reviewed_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approved Details (if exists) */}
                {loanApplication.final_approved_amount && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Approved Terms</h4>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                      <div>
                        <span className="text-muted-foreground text-sm">Approved Amount</span>
                        <div className="font-medium text-lg text-green-600">
                          {formatAmount(loanApplication.final_approved_amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Approved Term</span>
                        <div className="font-medium text-lg">{loanApplication.final_approved_term} {termUnit}</div>
                      </div>
                      {loanApplication.final_approved_interest_rate && (
                        <div>
                          <span className="text-muted-foreground text-sm">Approved Rate</span>
                          <div className="font-medium text-lg">{loanApplication.final_approved_interest_rate}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Loan Details</CardTitle>
                <CardDescription>Update term, link savings, and manage fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FormLabel>Loan Term ({termUnit})</FormLabel>
                    <Input
                      type="number"
                      value={editTerm ?? ''}
                      onChange={(e) => setEditTerm(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Linked Savings Account</FormLabel>
                    <Select value={editSavingsId} onValueChange={setEditSavingsId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select savings account (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {savingsAccounts.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.account_number} - {s.savings_products?.name} (Bal: {formatAmount(s.account_balance || 0)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Add Fee/Charge</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={selectedChargeId} onValueChange={setSelectedChargeId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCharges.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.calculation_type === 'percentage' ? `${c.amount}%` : `KES ${Number(c.amount).toLocaleString()}`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Custom amount (optional)"
                      value={customChargeAmount}
                      onChange={(e) => setCustomChargeAmount(e.target.value)}
                      type="number"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const sel = availableCharges.find((a: any) => a.id === selectedChargeId);
                        if (!sel) return;
                        const amt = customChargeAmount ? Number(customChargeAmount) : Number(sel.amount);
                        const newItem = { ...sel, amount: amt };
                        setEditCharges((prev) => {
                          if (prev.some((p: any) => p.id === newItem.id)) return prev;
                          return [...prev, newItem];
                        });
                        setSelectedChargeId('');
                        setCustomChargeAmount('');
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {editCharges.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Selected Charges</h4>
                    <div className="space-y-2">
                      {editCharges.map((c: any) => {
                        const calc = calculateFeeAmount(
                          {
                            id: c.id,
                            name: c.name,
                            calculation_type: c.calculation_type,
                            amount: Number(c.amount),
                            min_amount: c.min_amount ?? null,
                            max_amount: c.max_amount ?? null,
                            fee_type: c.fee_type,
                            charge_time_type: c.charge_time_type,
                          } as any,
                          Number(loanApplication.final_approved_amount ?? loanApplication.requested_amount ?? 0)
                        );
                        return (
                          <div key={c.id} className="flex items-center justify-between rounded border p-2">
                            <div>
                              <div className="text-sm font-medium">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{formatFeeDisplay(calc)}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setEditCharges((prev) => prev.filter((x: any) => x.id !== c.id))}>Remove</Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditTerm(loanApplication.requested_term);
                      setEditSavingsId(loanApplication.linked_savings_account_id || undefined);
                      setEditCharges(loanApplication.selected_charges || []);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      await updateLoan.mutateAsync({
                        loan_application_id: loanApplication.id,
                        requested_term: typeof editTerm === 'number' ? editTerm : undefined,
                        linked_savings_account_id: editSavingsId || null,
                        selected_charges: editCharges,
                      });
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approve" className="space-y-4">
            {isCompleted ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Application Processed</h3>
                    <p className="text-muted-foreground">
                      This loan application has been processed and completed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Form {...approvalForm}>
                <form onSubmit={approvalForm.handleSubmit(onApprovalSubmit)} className="space-y-4">
                  <Card>
<CardHeader>
  <CardTitle>Loan Approval Management</CardTitle>
  <CardDescription>
    Approve, reject, or manage the loan application
  </CardDescription>
  {profile && (
    <div className="text-xs text-muted-foreground mt-1">
      Action by: {profile.first_name} {profile.last_name} ({profile.email})
    </div>
  )}
</CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={approvalForm.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {canApprove && (
                                  <>
                                    <SelectItem value="approve">Approve Application</SelectItem>
                                    <SelectItem value="reject">Reject Application</SelectItem>
                                    <SelectItem value="request_changes">Request Changes</SelectItem>
                                  </>
                                )}
                                {canUndoApproval && (
                                  <SelectItem value="undo_approval">
                                    <div className="flex items-center gap-2">
                                      <Undo2 className="h-4 w-4" />
                                      Undo Approval
                                    </div>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {currentAction !== 'undo_approval' && (
                        <>
                          <FormField
                            control={approvalForm.control}
                            name="approval_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Approval Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {currentAction === 'approve' && (
                            <>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={approvalForm.control}
                                  name="approved_amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Approved Amount</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" {...field} />
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
                                      <FormLabel>Approved Term ({termUnit})</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} />
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
                                      <FormLabel>Approved Interest Rate (%)</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={approvalForm.control}
                                name="conditions"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Approval Conditions</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Any conditions for this approval..."
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </>
                      )}


                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={processApproval.isPending}
                          className={
                            currentAction === 'approve' 
                              ? "bg-green-600 hover:bg-green-700" 
                              : currentAction === 'reject' 
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          {processApproval.isPending ? "Processing..." : `${currentAction?.replace('_', ' ')} Application`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            )}
          </TabsContent>

          <TabsContent value="disburse" className="space-y-4">
            {isCompleted ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Banknote className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Loan Disbursed</h3>
                    <p className="text-muted-foreground">
                      This loan has been successfully disbursed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Form {...disbursementForm}>
                <form onSubmit={disbursementForm.handleSubmit(onDisbursementSubmit)} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Disbursement</CardTitle>
                      <CardDescription>
                        Configure disbursement details and release funds
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={disbursementForm.control}
                          name="disbursed_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disbursement Amount *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
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
                              <FormLabel>Disbursement Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
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
                            <FormLabel>Disbursement Method *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select disbursement method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="transfer_to_savings">Transfer to Savings Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {disbursementForm.watch('disbursement_method') === 'transfer_to_savings' && (
                        <Card className="border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-sm">Savings Account Selection</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {savingsAccounts.length === 0 ? (
                              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                  Client has no active savings accounts. Please create one first.
                                </span>
                              </div>
                            ) : (
                              <FormField
                                control={disbursementForm.control}
                                name="savings_account_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Select Savings Account *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select savings account" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {savingsAccounts.map((account) => (
                                          <SelectItem key={account.id} value={account.id}>
                                            {account.account_number} - {account.savings_products?.name} 
                                            (Balance: {formatAmount(account.account_balance || 0)})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {disbursementForm.watch('disbursement_method') === 'bank_transfer' && (
                        <Card className="border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-sm">Bank Transfer Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <FormField
                              control={disbursementForm.control}
                              name="bank_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={disbursementForm.control}
                              name="bank_account_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={disbursementForm.control}
                              name="bank_account_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {disbursementForm.watch('disbursement_method') === 'mpesa' && (
                        <Card className="border-green-200">
                          <CardHeader>
                            <CardTitle className="text-sm">M-Pesa Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FormField
                              control={disbursementForm.control}
                              name="mpesa_phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>M-Pesa Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="254712345678" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={processDisbursement.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processDisbursement.isPending ? "Processing..." : "Disburse Loan"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>

        <NewLoanDialog
          open={modifyOpen}
          onOpenChange={setModifyOpen}
          clientId={loanApplication.client_id}
          onApplicationCreated={() => {
            setModifyOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};