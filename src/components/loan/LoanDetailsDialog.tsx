import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoanSchedules } from "@/hooks/useLoanManagement";
import { format } from "date-fns";
import { 
  CalendarDays, 
  DollarSign, 
  User, 
  FileText, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle 
} from "lucide-react";

interface LoanDetailsDialogProps {
  loan: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoanDetailsDialog = ({ loan, open, onOpenChange }: LoanDetailsDialogProps) => {
  const { data: schedules } = useLoanSchedules(loan?.id);

  if (!loan) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <CalendarDays className="w-4 h-4 text-warning" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-success">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-warning">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(loan.status)}
            Loan Details - {loan.loan_number}
          </DialogTitle>
          <DialogDescription>
            Complete loan information and payment schedule
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Name:</span>
                    <span className="ml-2">{loan.clients?.first_name} {loan.clients?.last_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Client Number:</span>
                    <span className="ml-2">{loan.clients?.client_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{loan.clients?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{loan.clients?.email || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Loan Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Principal Amount:</span>
                    <span className="ml-2 font-bold text-primary">${loan.principal_amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Interest Rate:</span>
                    <span className="ml-2">{loan.interest_rate}% per annum</span>
                  </div>
                  <div>
                    <span className="font-medium">Term:</span>
                    <span className="ml-2">{loan.term_months} months</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={loan.status === 'active' ? 'default' : loan.status === 'overdue' ? 'destructive' : 'secondary'} className="ml-2">
                      {loan.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Total Amount:</span>
                    <span className="ml-2">${loan.total_amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Outstanding Balance:</span>
                    <span className="ml-2 font-bold text-destructive">${loan.outstanding_amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Paid Amount:</span>
                    <span className="ml-2 text-success">${loan.paid_amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Next Payment:</span>
                    <span className="ml-2">${schedules?.find(s => s.payment_status === 'unpaid')?.total_amount?.toLocaleString() || '0'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Disbursement Date:</span>
                    <span className="ml-2">{loan.disbursement_date ? format(new Date(loan.disbursement_date), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">First Payment:</span>
                    <span className="ml-2">{loan.first_payment_date ? format(new Date(loan.first_payment_date), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Final Payment:</span>
                    <span className="ml-2">{loan.final_payment_date ? format(new Date(loan.final_payment_date), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Next Due:</span>
                    <span className="ml-2 font-medium text-warning">
                      {schedules?.find(s => s.payment_status === 'unpaid')?.due_date ? 
                        format(new Date(schedules.find(s => s.payment_status === 'unpaid')!.due_date), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>
                  Complete repayment schedule with installment details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules?.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">#{schedule.installment_number}</TableCell>
                        <TableCell>{format(new Date(schedule.due_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${schedule.principal_amount.toLocaleString()}</TableCell>
                        <TableCell>${schedule.interest_amount.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">${schedule.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-success">${schedule.paid_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">${schedule.outstanding_amount.toLocaleString()}</TableCell>
                        <TableCell>{getPaymentStatusBadge(schedule.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All payments made towards this loan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Payment history will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loan Documents</CardTitle>
                <CardDescription>
                  All documents related to this loan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Loan documents will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            Process Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};