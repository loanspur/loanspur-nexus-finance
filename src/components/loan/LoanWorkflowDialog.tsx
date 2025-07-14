import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, CreditCard, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProcessLoanApproval, useProcessLoanDisbursement } from "@/hooks/useLoanManagement";

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().optional(),
  approved_amount: z.string().optional(),
  approved_term: z.string().optional(),
  approved_interest_rate: z.string().optional(),
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
    final_approved_amount?: number;
    final_approved_term?: number;
    final_approved_interest_rate?: number;
    clients?: {
      first_name: string;
      last_name: string;
      client_number: string;
    };
    loan_products?: {
      name: string;
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

  const approvalForm = useForm<ApprovalData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      action: 'approve',
      approved_amount: loanApplication.requested_amount?.toString(),
      approved_term: loanApplication.requested_term?.toString(),
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

  const canApprove = loanApplication.status === 'pending' || loanApplication.status === 'under_review';
  const canDisburse = loanApplication.status === 'pending_disbursement' || loanApplication.status === 'approved';
  const isCompleted = loanApplication.status === 'disbursed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Loan Application Workflow
          </DialogTitle>
          <DialogDescription>
            {loanApplication.application_number} - {loanApplication.clients?.first_name} {loanApplication.clients?.last_name}
          </DialogDescription>
        </DialogHeader>

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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <div className="font-medium">
                      {loanApplication.clients?.first_name} {loanApplication.clients?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {loanApplication.clients?.client_number}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loan Product</span>
                    <div className="font-medium">{loanApplication.loan_products?.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested Amount</span>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(loanApplication.requested_amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested Term</span>
                    <div className="font-medium">{loanApplication.requested_term} months</div>
                  </div>
                  {loanApplication.final_approved_amount && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Approved Amount</span>
                        <div className="font-medium text-green-600">
                          {formatCurrency(loanApplication.final_approved_amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Approved Term</span>
                        <div className="font-medium">{loanApplication.final_approved_term} months</div>
                      </div>
                    </>
                  )}
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

                      {approvalForm.watch("action") === "approve" && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={approvalForm.control}
                            name="approved_amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Approved Amount (KES)</FormLabel>
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
                                <FormLabel>Approved Term (Months)</FormLabel>
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
                              <FormItem className="col-span-2">
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
                <form onSubmit={disbursementForm.handleSubmit(onDisbursementSubmit)} className="space-y-4">
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