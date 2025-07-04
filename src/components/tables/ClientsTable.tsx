import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Phone, Mail, Building, CreditCard, PiggyBank } from "lucide-react";
import { useClients, type Client } from "@/hooks/useSupabase";
import { format } from "date-fns";

interface ClientsTableProps {
  onCreateClient: () => void;
}

export const ClientsTable = ({ onCreateClient }: ClientsTableProps) => {
  const { data: clients, isLoading, error } = useClients();

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "KES 0";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const calculateTotalLoanBalance = (client: any) => {
    if (!client.loans || client.loans.length === 0) return 0;
    return client.loans.reduce((total: number, loan: any) => total + (loan.outstanding_balance || 0), 0);
  };

  const calculateTotalSavingsBalance = (client: any) => {
    if (!client.savings_accounts || client.savings_accounts.length === 0) return 0;
    return client.savings_accounts.reduce((total: number, account: any) => total + (account.account_balance || 0), 0);
  };

  const getRepaymentRateColor = (rate: number) => {
    if (rate >= 95) return 'text-success';
    if (rate >= 80) return 'text-warning';
    return 'text-destructive';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading clients: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients Management
            </CardTitle>
            <CardDescription>
              Manage client accounts and information
            </CardDescription>
          </div>
          <Button onClick={onCreateClient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading clients...</div>
          </div>
        ) : clients && clients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Loan Balance</TableHead>
                <TableHead>Savings Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">
                      {client.first_name} {client.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      #{client.client_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {client.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Building className="h-3 w-3" />
                      Main Branch
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CreditCard className="h-3 w-3" />
                      {formatCurrency(calculateTotalLoanBalance(client))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <PiggyBank className="h-3 w-3" />
                      {formatCurrency(calculateTotalSavingsBalance(client))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-4">Start building your client base by adding your first client.</p>
            <Button onClick={onCreateClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Client
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};