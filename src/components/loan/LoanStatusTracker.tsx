import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Banknote, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface LoanStatusTrackerProps {
  loanApplication: {
    id: string;
    application_number: string;
    status: string;
    requested_amount: number;
    requested_term: number;
    final_approved_amount?: number;
    final_approved_term?: number;
    final_approved_interest_rate?: number;
    created_at: string;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    approval_notes?: string;
    clients?: {
      first_name: string;
      last_name: string;
      client_number: string;
    };
    loan_products?: {
      name: string;
    };
  };
}

export const LoanStatusTracker = ({ loanApplication }: LoanStatusTrackerProps) => {
  const getStatusSteps = () => {
    const steps = [
      {
        id: 'submitted',
        title: 'Application Submitted',
        description: 'Loan application received and validated',
        icon: FileText,
        status: 'completed',
        date: loanApplication.submitted_at || loanApplication.created_at
      },
      {
        id: 'under_review',
        title: 'Under Review',
        description: 'Application is being reviewed by loan officers',
        icon: Clock,
        status: ['pending', 'under_review'].includes(loanApplication.status) ? 'current' : 'completed',
        date: loanApplication.reviewed_at
      },
      {
        id: 'decision',
        title: 'Decision Made',
        description: loanApplication.status === 'approved' || loanApplication.status === 'pending_disbursement' || loanApplication.status === 'disbursed' 
          ? 'Application approved' 
          : loanApplication.status === 'rejected' 
            ? 'Application rejected' 
            : 'Pending decision',
        icon: loanApplication.status === 'rejected' ? XCircle : CheckCircle,
        status: ['approved', 'pending_disbursement', 'disbursed', 'rejected'].includes(loanApplication.status) ? 'completed' : 'pending',
        date: loanApplication.reviewed_at
      },
      {
        id: 'disbursement',
        title: 'Disbursement',
        description: loanApplication.status === 'disbursed' ? 'Funds disbursed to client' : 'Pending disbursement',
        icon: Banknote,
        status: loanApplication.status === 'disbursed' ? 'completed' : loanApplication.status === 'pending_disbursement' ? 'current' : 'pending',
        date: undefined // Would come from disbursement record
      }
    ];

    // If rejected, mark disbursement as skipped
    if (loanApplication.status === 'rejected') {
      steps[3].status = 'skipped';
      steps[3].description = 'Disbursement not applicable';
    }

    return steps;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'current':
        return 'text-primary';
      case 'skipped':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStepBgColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 border-success/20';
      case 'current':
        return 'bg-primary/10 border-primary/20';
      case 'skipped':
        return 'bg-muted border-muted-foreground/20';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const steps = getStatusSteps();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Loan Application Progress
        </CardTitle>
        <CardDescription>
          Track the status and progress of loan application {loanApplication.application_number}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Application Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">
              {loanApplication.clients?.first_name} {loanApplication.clients?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {loanApplication.clients?.client_number}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Loan Product</p>
            <p className="font-medium">{loanApplication.loan_products?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Requested Amount</p>
            <p className="font-medium text-primary">
              {formatCurrency(loanApplication.requested_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Term</p>
            <p className="font-medium">{loanApplication.requested_term} months</p>
          </div>
          {loanApplication.final_approved_amount && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="font-medium text-success">
                  {formatCurrency(loanApplication.final_approved_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Term</p>
                <p className="font-medium">{loanApplication.final_approved_term} months</p>
              </div>
            </>
          )}
        </div>

        {/* Status Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium">Application Timeline</h4>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className={`rounded-full p-2 border-2 ${getStepBgColor(step.status)}`}>
                    <Icon className={`h-4 w-4 ${getStepColor(step.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${getStepColor(step.status)}`}>
                        {step.title}
                      </p>
                      {step.date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(step.date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {index < steps.length - 1 && (
                      <div className="h-6 w-px bg-border ml-4 mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Information */}
        {loanApplication.approval_notes && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Review Notes</h4>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm">{loanApplication.approval_notes}</p>
              </div>
            </div>
          </>
        )}

        {/* Current Status Badge */}
        <div className="flex items-center justify-center pt-4">
          <Badge 
            variant={
              loanApplication.status === 'disbursed' ? 'default' :
              loanApplication.status === 'rejected' ? 'destructive' :
              ['approved', 'pending_disbursement'].includes(loanApplication.status) ? 'default' :
              'secondary'
            }
            className="px-4 py-2 text-sm"
          >
            Current Status: {loanApplication.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};