import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClientPendingLoansView } from "@/components/loan/ClientPendingLoansView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ClientLoanReviewPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // For demo purposes, we'll use the specific client ID CL015
  const clientNumber = "CL015";

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_number', clientNumber)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientNumber,
  });

  // Fetch loan applications for this client
  const { data: loanApplications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['loan-applications', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products(name, short_name, min_nominal_interest_rate, max_nominal_interest_rate),
          clients(first_name, last_name, client_number, email, phone)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id,
  });

  // Mutation for approving loan application
  const approveMutation = useMutation({
    mutationFn: async ({ applicationId, notes }: { applicationId: string; notes?: string }) => {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          approval_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id
        })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      toast({
        title: "Application Approved",
        description: "The loan application has been successfully approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve the application. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for rejecting loan application
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'rejected',
          approval_notes: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id
        })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      toast({
        title: "Application Rejected",
        description: "The loan application has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject the application. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for modifying loan application
  const modifyMutation = useMutation({
    mutationFn: async ({ applicationId, changes }: { applicationId: string; changes: any }) => {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'under_review',
          approval_notes: changes.notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id
        })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      toast({
        title: "Modification Requested",
        description: "The application has been sent back for modifications.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to request modifications. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (applicationId: string, notes?: string) => {
    approveMutation.mutate({ applicationId, notes });
  };

  const handleReject = (applicationId: string, reason: string) => {
    rejectMutation.mutate({ applicationId, reason });
  };

  const handleModify = (applicationId: string, changes: any) => {
    modifyMutation.mutate({ applicationId, changes });
  };

  const pendingCount = loanApplications.filter(app => app.status === 'pending').length;
  const approvedCount = loanApplications.filter(app => app.status === 'approved').length;
  const rejectedCount = loanApplications.filter(app => app.status === 'rejected').length;

  if (clientLoading || applicationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Client Not Found</h2>
          <p className="text-muted-foreground">The client with number {clientNumber} was not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tenant/loans')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Loans
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Loan Review</h1>
            <p className="text-muted-foreground">Review and manage loan applications</p>
          </div>
        </div>
      </div>

      {/* Client Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-lg">{client.first_name} {client.last_name}</h3>
              <p className="text-sm text-muted-foreground">Client #{client.client_number}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={client.approval_status === 'approved' ? 'default' : 'outline'}>
                  {client.approval_status}
                </Badge>
                <Badge variant={client.kyc_status === 'completed' ? 'default' : 'outline'}>
                  KYC: {client.kyc_status}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {client.email || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {client.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Joined {format(new Date(client.created_at), 'MMM yyyy')}
                </div>
              </div>
            </div>

            <div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending Applications</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{approvedCount}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{rejectedCount}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Loans View */}
      <ClientPendingLoansView
        clientId={client.id}
        clientName={`${client.first_name} ${client.last_name}`}
        loanApplications={loanApplications}
        onApprove={handleApprove}
        onReject={handleReject}
        onModify={handleModify}
      />

      {/* All Applications Summary */}
      {loanApplications.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Applications History</CardTitle>
            <CardDescription>Complete history of loan applications for this client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loanApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{app.application_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                        minimumFractionDigits: 0
                      }).format(app.requested_amount)} - {app.requested_term} months
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(app.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      app.status === 'pending' ? 'outline' :
                      app.status === 'approved' ? 'default' :
                      app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status}
                    </Badge>
                    {app.status === 'approved' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientLoanReviewPage;