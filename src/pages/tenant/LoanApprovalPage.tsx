import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar as CalendarIcon,
  FileText,
  User,
  DollarSign,
  Eye,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const LoanApprovalPage = () => {
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Approval form state
  const [approvalDate, setApprovalDate] = useState<Date | undefined>(new Date());
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [approvalNotes, setApprovalNotes] = useState("");
  
  // Rejection form state
  const [rejectionDate, setRejectionDate] = useState<Date | undefined>(new Date());
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLoanApplications();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = loanApplications.filter(app =>
        app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.clients?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.clients?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.loan_products?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApplications(filtered);
    } else {
      setFilteredApplications(loanApplications);
    }
  }, [searchTerm, loanApplications]);

  const fetchLoanApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            client_number,
            phone,
            email
          ),
          loan_products (
            name,
            short_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLoanApplications(data || []);
    } catch (error) {
      console.error('Error fetching loan applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch loan applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication || !approvalDate || !approvedAmount || approvedAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'pending_disbursement',
          approved_amount: approvedAmount,
          approved_at: approvalDate.toISOString(),
          approval_notes: approvalNotes
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast({
        title: "Application Approved",
        description: `Loan application ${selectedApplication.application_number} has been approved and moved to pending disbursement`,
      });

      setShowApprovalDialog(false);
      setSelectedApplication(null);
      setApprovedAmount(0);
      setApprovalNotes("");
      setApprovalDate(new Date());
      fetchLoanApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication || !rejectionDate || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'rejected',
          rejected_at: rejectionDate.toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast({
        title: "Application Rejected",
        description: `Loan application ${selectedApplication.application_number} has been rejected`,
      });

      setShowRejectDialog(false);
      setSelectedApplication(null);
      setRejectionReason("");
      setRejectionDate(new Date());
      fetchLoanApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading loan applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loan Approval</h1>
        <p className="text-muted-foreground">Review and approve pending loan applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Pending Loan Applications ({filteredApplications.length})
          </CardTitle>
          <CardDescription>
            Applications awaiting approval decision
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Applied Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-mono text-sm">
                      {application.application_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.clients?.first_name} {application.clients?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {application.clients?.client_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.loan_products?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {application.loan_products?.short_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">
                        {formatCurrency(application.requested_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{application.requested_term} months</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(application.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setApprovedAmount(application.requested_amount);
                            setShowApprovalDialog(true);
                          }}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowRejectDialog(true);
                          }}
                          className="border-red-600 text-red-600 hover:bg-red-50"
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
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Loan Application
            </DialogTitle>
            <DialogDescription>
              Application: {selectedApplication?.application_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approval-date">Approval Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !approvalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {approvalDate ? format(approvalDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={approvalDate}
                    onSelect={setApprovalDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="applied-amount">Applied Amount</Label>
              <Input
                id="applied-amount"
                type="text"
                value={formatCurrency(selectedApplication?.requested_amount || 0)}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approved-amount">Approved Amount *</Label>
              <Input
                id="approved-amount"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                placeholder="Enter approved amount"
                min="0"
                step="100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveApplication}
              disabled={!approvalDate || !approvedAmount || approvedAmount <= 0}
            >
              Approve & Move to Disbursement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Loan Application
            </DialogTitle>
            <DialogDescription>
              Application: {selectedApplication?.application_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-date">Rejection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !rejectionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rejectionDate ? format(rejectionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={rejectionDate}
                    onSelect={setRejectionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a detailed reason for rejecting this application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectApplication}
              disabled={!rejectionDate || !rejectionReason.trim()}
            >
              Reject Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details
            </DialogTitle>
            <DialogDescription>
              Application: {selectedApplication?.application_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Client Name</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication?.clients?.first_name} {selectedApplication?.clients?.last_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Client Number</Label>
                <p className="text-sm text-muted-foreground">{selectedApplication?.clients?.client_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Product</Label>
                <p className="text-sm text-muted-foreground">{selectedApplication?.loan_products?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Applied Amount</Label>
                <p className="text-sm text-muted-foreground">{formatCurrency(selectedApplication?.requested_amount || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Term</Label>
                <p className="text-sm text-muted-foreground">{selectedApplication?.requested_term} months</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Applied Date</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication?.created_at ? format(new Date(selectedApplication.created_at), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Purpose</Label>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedApplication?.purpose?.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
            
            {selectedApplication?.notes && (
              <div>
                <Label className="text-sm font-medium">Application Notes</Label>
                <p className="text-sm text-muted-foreground">{selectedApplication.notes}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApprovalPage;