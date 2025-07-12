import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoanApplicationForm } from "@/components/forms/LoanApplicationForm";
import { LoanDetailsDialog } from "@/components/loan/LoanDetailsDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle 
} from "lucide-react";

const LoansPage = () => {
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { profile } = useAuth();

  // Fetch loans data
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients(first_name, last_name, client_number, phone, email),
          loan_products(name, short_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Calculate summary statistics
  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
  const collectionRate = totalLoans > 0 ? ((totalLoans - overdueLoans) / totalLoans * 100).toFixed(1) : 0;

  // Filter loans based on search term
  const filteredLoans = loans.filter(loan => 
    loan.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${loan.clients?.first_name} ${loan.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.clients?.client_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loan Management</h1>
          <p className="text-muted-foreground">Track and manage all loan accounts</p>
        </div>
        <LoanApplicationForm>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Loan Application
          </Button>
        </LoanApplicationForm>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Total Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalLoans}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Outstanding Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total balance</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Overdue Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueLoans}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{collectionRate}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>Complete overview of loan portfolio</CardDescription>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search loans..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading loans...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No loans found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-lg">
                      {loan.clients?.first_name} {loan.clients?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Loan: {loan.loan_number} | Client: {loan.clients?.client_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Product: {loan.loan_products?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Disbursed: {loan.disbursement_date ? format(new Date(loan.disbursement_date), 'MMM dd, yyyy') : 'Pending'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium">Principal: ${loan.principal_amount?.toLocaleString()}</div>
                      <div className="text-sm font-medium">Balance: ${loan.outstanding_balance?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Rate: {loan.interest_rate}%</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">Term: {loan.term_months} months</div>
                      <div className="text-xs text-muted-foreground">
                        Next Due: {loan.next_repayment_date ? format(new Date(loan.next_repayment_date), 'MMM dd') : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <Badge 
                        variant={
                          loan.status === 'active' ? 'default' : 
                          loan.status === 'overdue' ? 'destructive' : 'secondary'
                        }
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedLoan(loan)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">Payment</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LoanDetailsDialog 
        loan={selectedLoan}
        clientName={selectedLoan?.client_name || "Unknown Client"}
        open={!!selectedLoan}
        onOpenChange={(open) => !open && setSelectedLoan(null)}
      />
    </div>
  );
};

export default LoansPage;