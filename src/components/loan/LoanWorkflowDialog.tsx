import { useState } from "react";
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
import { CheckCircle, XCircle, Clock, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProcessLoanApproval, useProcessLoanDisbursement } from "@/hooks/useLoanManagement";

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().optional(),
  approved_amount: z.string().optional(),
  approved_term: z.string().optional(),
  approved_interest_rate: z.string().optional(),
  approval_date: z.string().min(1, "Approval date is required"),
  conditions: z.string().optional(),
});

const disbursementSchema = z.object({
  disbursement_method: z.enum(['bank_transfer', 'mpesa', 'cash', 'check']),
  disbursed_amount: z.string().min(1, "Disbursement amount is required"),
  disbursement_date: z.string().min(1, "Disbursement date is required"),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_name: z.string().optional(),
  mpesa_phone: z.string().optional(),
});

type ApprovalData = z.infer<typeof approvalSchema>;
type DisbursementData = z.infer<typeof disbursementSchema>;

interface LoanWorkflowDialogProps {
  loanApplication: {
    id: string;
    application_number: string;
    status: string;
    requested_amount: number;
    requested_term: number;
    requested_interest_rate?: number;
    purpose?: string;
    loan_charges?: any[];
    final_approved_amount?: number;
    final_approved_term?: number;
    final_approved_interest_rate?: number;
    // Optional frequency fields present on some records
    term_frequency?: string;
    repayment_frequency?: string;
    // Related client and product info
    clients?: {
      first_name: string;
      last_name: string;
      client_number: string;
      phone?: string;
      email?: string;
    };
    loan_products?: {
      name: string;
      short_name?: string;
      currency_code?: string;
      default_nominal_interest_rate?: number;
      min_principal?: number;
      max_principal?: number;
      default_term?: number;
      min_term?: number;
      max_term?: number;
      // Include optional repayment frequency from product
      repayment_frequency?: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LoanWorkflowDialog = ({
  loanApplication,
  open,
  onOpenChange,
  onSuccess
}: LoanWorkflowDialogProps) => {
  const [currentTab, setCurrentTab] = useState("details");
  const { toast } = useToast();
  const processApproval = useProcessLoanApproval();
  const processDisbursement = useProcessLoanDisbursement();

  // Guard clause to prevent null reference errors
  if (!loanApplication) {
    return null;
  }

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

  const getTermUnit = (frequency?: string) => {
    const f = (frequency || '').toLowerCase();
    if (f.includes('day')) return 'days';
    if (f.includes('week')) return 'weeks';
    if (f.includes('month')) return 'months';
    if (f.includes('year') || f.includes('ann')) return 'years';
    return 'months';
  };

  const productFrequency = loanApplication.loan_products?.repayment_frequency;
  const frequency = (loanApplication.term_frequency || loanApplication.repayment_frequency || productFrequency || 'monthly') as string;
  const termUnit = getTermUnit(frequency);
  const productTermUnit = getTermUnit(productFrequency);


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
        comments: data.comments,
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

  const onDisbursementSubmit = async (data: DisbursementData, e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await processDisbursement.mutateAsync({
        loan_application_id: loanApplication.id,
        disbursed_amount: parseFloat(data.disbursed_amount),
        disbursement_date: data.disbursement_date,
        disbursement_method: data.disbursement_method,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number,
        bank_name: data.bank_name,
        mpesa_phone: data.mpesa_phone,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing disbursement:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Use consistent status checking logic
  const canApprove = loanApplication.status === 'pending' || loanApplication.status === 'under_review';
  const canDisburse = loanApplication.status === 'pending_disbursement' || loanApplication.status === 'approved';
  const isCompleted = loanApplication.status === 'disbursed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Application Details</TabsTrigger>
            <TabsTrigger value="approve" disabled={!canApprove && !isCompleted}>
              {canApprove ? 'Approval' : 'Approved'}
            </TabsTrigger>
            <TabsTrigger value="disburse" disabled={!canDisburse && !isCompleted}>
              {canDisburse ? 'Disbursement' : 'Disbursed'}
            </TabsTrigger>
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
                {/* Client & Product Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Client Information</h4>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {loanApplication.clients?.first_name} {loanApplication.clients?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Client: {loanApplication.clients?.client_number}
                        </div>
                        {loanApplication.clients?.phone && (
                          <div className="text-xs text-muted-foreground">
                            Phone: {loanApplication.clients?.phone}
                          </div>
                        )}
                        {loanApplication.clients?.email && (
                          <div className="text-xs text-muted-foreground">
                            Email: {loanApplication.clients?.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Loan Product</h4>
                      <div className="space-y-1">
                        <div className="font-medium">{loanApplication.loan_products?.name}</div>
                        {loanApplication.loan_products?.short_name && (
                          <div className="text-xs text-muted-foreground">
                            Code: {loanApplication.loan_products?.short_name}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Currency: {loanApplication.loan_products?.currency_code || 'KES'}
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
                        {formatCurrency(loanApplication.requested_amount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Requested Term</span>
                      <div className="font-medium text-lg">{loanApplication.requested_term}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Interest Rate</span>
                      <div className="font-medium text-lg">
                        {loanApplication.requested_interest_rate || loanApplication.loan_products?.default_nominal_interest_rate || 'TBD'}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Terms & Limits */}
                {loanApplication.loan_products && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Product Terms & Limits</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {loanApplication.loan_products.min_principal && (
                        <div>
                          <span className="text-muted-foreground">Min Amount</span>
                          <div className="font-medium">{formatCurrency(loanApplication.loan_products.min_principal)}</div>
                        </div>
                      )}
                      {loanApplication.loan_products.max_principal && (
                        <div>
                          <span className="text-muted-foreground">Max Amount</span>
                          <div className="font-medium">{formatCurrency(loanApplication.loan_products.max_principal)}</div>
                        </div>
                      )}
                      {loanApplication.loan_products.default_term && (
                        <div>
                          <span className="text-muted-foreground">Default Term</span>
                          <div className="font-medium">{loanApplication.loan_products.default_term}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purpose */}
                {loanApplication.purpose && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Loan Purpose</h4>
                    <div className="text-sm">{loanApplication.purpose}</div>
                  </div>
                )}

                {/* Charges & Fees */}
                {loanApplication.loan_charges && loanApplication.loan_charges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Applicable Charges & Fees</h4>
                    <div className="space-y-2">
                      {loanApplication.loan_charges.map((charge: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{charge.name || charge.fee_name}</span>
                          <span className="font-medium">{formatCurrency(charge.amount || charge.calculated_amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approve" className="space-y-4">
            {isCompleted ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Application Approved</h3>
                    <p className="text-muted-foreground">
                      This loan application has been processed and approved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Form {...approvalForm}>
                <form onSubmit={approvalForm.handleSubmit(onApprovalSubmit)} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Approval Decision</CardTitle>
                      <CardDescription>
                        Review and approve or reject the loan application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={approvalForm.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decision *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select decision" />
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

                      <FormField
                        control={approvalForm.control}
                        name="approval_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Approval Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {approvalForm.watch("action") === "approve" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={approvalForm.control}
                              name="approved_amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Approved Amount ({loanApplication.loan_products?.currency_code || 'KES'})</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter approved amount"
                                      {...field}
                                    />
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
                                    <Input
                                      type="number"
                                      placeholder="Enter approved term"
                                      {...field}
                                    />
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
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Enter approved interest rate"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <FormField
                        control={approvalForm.control}
                        name="comments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comments</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter approval comments or conditions"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={processApproval.isPending}
                          className="flex-1"
                        >
                          {processApproval.isPending ? "Processing..." : "Submit Decision"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            )}
          </TabsContent>

          <TabsContent value="disburse" className="space-y-4">
            {loanApplication.status === 'disbursed' ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Banknote className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Loan Disbursed</h3>
                    <p className="text-muted-foreground">
                      This loan has been successfully disbursed to the client.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Form {...disbursementForm}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  disbursementForm.handleSubmit((data) => onDisbursementSubmit(data, e))();
                }} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Disbursement</CardTitle>
                      <CardDescription>
                        Configure disbursement details for the approved loan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={disbursementForm.control}
                          name="disbursed_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disbursement Amount (KES) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter amount to disburse"
                                  {...field}
                                />
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
                                <Input
                                  type="date"
                                  {...field}
                                />
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
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {disbursementForm.watch("disbursement_method") === "mpesa" && (
                        <FormField
                          control={disbursementForm.control}
                          name="mpesa_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>M-Pesa Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. 254712345678"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {disbursementForm.watch("disbursement_method") === "bank_transfer" && (
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={disbursementForm.control}
                            name="bank_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. KCB Bank" {...field} />
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
                                  <Input placeholder="Account holder name" {...field} />
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
                                  <Input placeholder="Bank account number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={processDisbursement.isPending}
                          className="flex-1"
                        >
                          {processDisbursement.isPending ? "Processing..." : "Disburse Loan"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};