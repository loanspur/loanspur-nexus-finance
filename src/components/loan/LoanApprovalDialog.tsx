import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProcessApprovalAction } from "@/hooks/useApprovalRequests";
import { CheckCircle, XCircle, AlertCircle, User, DollarSign, Calendar } from "lucide-react";

const approvalSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
  approved_amount: z.number().optional(),
  approved_term: z.number().optional(),
  approved_interest_rate: z.number().optional(),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface LoanApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalRequest: any;
}

export const LoanApprovalDialog = ({
  open,
  onOpenChange,
  approvalRequest,
}: LoanApprovalDialogProps) => {
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | null>(null);
  const processApproval = useProcessApprovalAction();

  const loanData = approvalRequest?.record_data;
  const requester = approvalRequest?.requester;

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comments: "",
      approved_amount: (loanData?.requested_amount as number | undefined),
      approved_term: (loanData?.requested_term as number | undefined),
      approved_interest_rate: ((loanData?.requested_interest_rate ?? loanData?.interest_rate) as number | undefined),
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
  const frequency = (loanData?.term_frequency || loanData?.repayment_frequency || loanData?.loan_products?.repayment_frequency || 'monthly') as string;
  const termUnit = getTermUnit(frequency);

  const onSubmit = async (data: ApprovalFormData) => {
    if (!selectedAction) return;

    try {
      await processApproval.mutateAsync({
        approval_request_id: approvalRequest.id,
        action: selectedAction,
        comments: data.comments,
      });
      onOpenChange(false);
      form.reset();
      setSelectedAction(null);
    } catch (error) {
      console.error("Error processing approval:", error);
    }
  };

  if (!approvalRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Loan Application Approval
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this loan application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Requested By</p>
                    <p className="text-sm text-muted-foreground">
                      {requester?.first_name} {requester?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Requested Amount</p>
                    <p className="text-sm text-muted-foreground">
                      ${loanData?.requested_amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Term</p>
                    <p className="text-sm text-muted-foreground">
                      {loanData?.requested_term} {termUnit}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge variant={
                    approvalRequest.priority === 'urgent' ? 'destructive' :
                    approvalRequest.priority === 'high' ? 'secondary' : 'outline'
                  }>
                    {approvalRequest.priority}
                  </Badge>
                </div>
              </div>
              
              {loanData?.purpose && (
                <div>
                  <p className="text-sm font-medium mb-1">Loan Purpose</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {loanData.purpose}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Action Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Action</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedAction === 'approved' ? 'default' : 'outline'}
                onClick={() => setSelectedAction('approved')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Approve</span>
              </Button>
              <Button
                type="button"
                variant={selectedAction === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setSelectedAction('rejected')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <XCircle className="w-6 h-6" />
                <span>Reject</span>
              </Button>
            </div>
          </div>

          {/* Approval Form */}
          {selectedAction && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {selectedAction === 'approved' && (
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="approved_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approved Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={loanData?.requested_amount?.toString()}
                              {...field}
                              readOnly
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="approved_term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approved Term ({termUnit})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={loanData?.requested_term?.toString()}
                              {...field}
                              readOnly
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="approved_interest_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="12.5"
                              {...field}
                              readOnly
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comments {selectedAction === 'rejected' && <span className="text-destructive">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`Add your ${selectedAction === 'approved' ? 'approval' : 'rejection'} comments here...`}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      setSelectedAction(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processApproval.isPending}
                    variant={selectedAction === 'approved' ? 'default' : 'destructive'}
                  >
                    {processApproval.isPending ? 'Processing...' : 
                     selectedAction === 'approved' ? 'Approve Application' : 'Reject Application'
                    }
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};