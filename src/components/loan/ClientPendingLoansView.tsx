import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Eye,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  User
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClientPendingLoansViewProps {
  clientId: string;
  clientName: string;
  loanApplications: any[];
  onApprove: (applicationId: string, notes?: string) => void;
  onReject: (applicationId: string, reason: string) => void;
  onModify: (applicationId: string, changes: any) => void;
}

export const ClientPendingLoansView = ({
  clientId,
  clientName,
  loanApplications,
  onApprove,
  onReject,
  onModify
}: ClientPendingLoansViewProps) => {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | 'view'>('view');
  const [actionNotes, setActionNotes] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const pendingApplications = loanApplications.filter(app => 
    app.client_id === clientId && app.status === 'pending'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 animate-pulse"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (application: any, action: 'approve' | 'reject' | 'modify' | 'view') => {
    setSelectedApplication(application);
    setActionType(action);
    setActionNotes("");
    
    if (action === 'approve') {
      setShowConfirmDialog(true);
    } else {
      setShowActionDialog(true);
    }
  };

  const executeAction = () => {
    if (!selectedApplication) return;

    switch (actionType) {
      case 'approve':
        onApprove(selectedApplication.id, actionNotes);
        toast({
          title: "Application Approved",
          description: `Loan application ${selectedApplication.application_number} has been approved.`,
        });
        break;
      case 'reject':
        if (!actionNotes.trim()) {
          toast({
            title: "Rejection Reason Required",
            description: "Please provide a reason for rejection.",
            variant: "destructive",
          });
          return;
        }
        onReject(selectedApplication.id, actionNotes);
        toast({
          title: "Application Rejected",
          description: `Loan application ${selectedApplication.application_number} has been rejected.`,
        });
        break;
      case 'modify':
        // This would typically open a more complex form
        toast({
          title: "Modification Requested",
          description: "Application modification dialog would open here.",
        });
        break;
    }
    
    setShowActionDialog(false);
    setShowConfirmDialog(false);
    setSelectedApplication(null);
    setActionNotes("");
  };

  const getActionButtonColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'reject':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'modify':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return '';
    }
  };

  if (pendingApplications.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {clientName} - Pending Loan Applications
          </CardTitle>
          <CardDescription>No pending loan applications found for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending applications to review</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {clientName} - Pending Loan Applications
          </CardTitle>
          <CardDescription>
            {pendingApplications.length} pending application{pendingApplications.length > 1 ? 's' : ''} requiring review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium font-mono text-sm">
                      {application.application_number}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {application.loan_products?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {application.loan_products?.short_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">
                        {formatCurrency(application.requested_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{application.requested_term} months</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">
                        {application.purpose?.replace(/_/g, ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(application.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(application.created_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(application, 'view')}
                          className="h-8"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(application, 'approve')}
                          className={`h-8 ${getActionButtonColor('approve')}`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(application, 'modify')}
                          className={`h-8 ${getActionButtonColor('modify')}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modify
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(application, 'reject')}
                          className={`h-8 ${getActionButtonColor('reject')}`}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'view' && <Eye className="h-5 w-5" />}
              {actionType === 'reject' && <XCircle className="h-5 w-5 text-red-600" />}
              {actionType === 'modify' && <Edit className="h-5 w-5 text-blue-600" />}
              {actionType === 'view' && 'View Application Details'}
              {actionType === 'reject' && 'Reject Application'}
              {actionType === 'modify' && 'Modify Application'}
            </DialogTitle>
            <DialogDescription>
              Application: {selectedApplication?.application_number} - {formatCurrency(selectedApplication?.requested_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'view' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Requested Amount</label>
                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedApplication?.requested_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Term</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication?.requested_term} months</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Purpose</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedApplication?.purpose?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <p className="text-sm text-muted-foreground">{selectedApplication?.loan_products?.name}</p>
                </div>
              </div>
            )}
            
            {actionType === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600">Reason for Rejection *</label>
                <Textarea
                  placeholder="Please provide a detailed reason for rejecting this application..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
            
            {actionType === 'modify' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-600">Modification Notes</label>
                <Textarea
                  placeholder="Describe the changes needed for this application..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Note: This will send the application back to the client for modifications.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            {actionType !== 'view' && (
              <Button
                onClick={executeAction}
                className={actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 
                          actionType === 'modify' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {actionType === 'reject' ? 'Reject Application' : 
                 actionType === 'modify' ? 'Request Modification' : 'Confirm'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Approval */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Loan Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve application {selectedApplication?.application_number} for {formatCurrency(selectedApplication?.requested_amount || 0)}?
              This will move the application to the disbursement stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Approval Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this approval..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};