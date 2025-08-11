import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Phone, Mail, Building, CreditCard, PiggyBank, Search, Eye, FileText, CheckCircle } from "lucide-react";
import { useClients, useActivateClient, type Client } from "@/hooks/useSupabase";
import { CleanClientDetailsDialog } from "@/components/client/CleanClientDetailsDialog";
import { FullLoanApplicationDialog } from "@/components/client/FullLoanApplicationDialog";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ClientsTableProps {
  onCreateClient: () => void;
}

export const ClientsTable = ({ onCreateClient }: ClientsTableProps) => {
  const { data: clients, isLoading, error } = useClients();
  const activateClient = useActivateClient();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoanApplicationDialogOpen, setIsLoanApplicationDialogOpen] = useState(false);
  const [selectedClientForLoan, setSelectedClientForLoan] = useState<string>("");

  // Filter and limit clients safely (guard against null entries)
  const safeClients = (clients || []).filter((c: any) => c && typeof c === 'object');
  const filteredClients = safeClients.filter((client: any) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (client.client_number || '').toLowerCase().includes(searchLower) ||
      (client.phone || '').toLowerCase().includes(searchLower) ||
      (client.email || '').toLowerCase().includes(searchLower)
    );
  });

  const displayedClients = filteredClients.slice(0, parseInt(itemsPerPage));
  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setIsDetailsDialogOpen(true);
  };

  const handleCreateLoan = (client: any) => {
    setSelectedClientForLoan(client.id);
    setIsLoanApplicationDialogOpen(true);
  };

  const handleLoanApplicationCreated = () => {
    // Refresh clients data or show success message
    setIsLoanApplicationDialogOpen(false);
    setSelectedClientForLoan("");
  };

  const handleActivateClient = (clientId: string) => {
    activateClient.mutate(clientId);
  };

  const canActivateClient = (client: any) => {
    return !client.is_active && 
           client.first_name && 
           client.last_name && 
           client.phone && 
           client.date_of_birth &&
           (client.national_id || client.passport_number || client.driving_license_number);
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
        <div></div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 clients</SelectItem>
                <SelectItem value="10">10 clients</SelectItem>
                <SelectItem value="25">25 clients</SelectItem>
                <SelectItem value="50">50 clients</SelectItem>
                <SelectItem value="100">100 clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCreateClient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading clients...</div>
          </div>
        ) : displayedClients && displayedClients.length > 0 ? (
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedClients.map((client: any) => (
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
                    <div className="flex items-center gap-2">
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {canActivateClient(client) && (
                        <Badge variant="outline" className="text-xs">
                          Ready to Activate
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CreditCard className="h-3 w-3" />
                      {formatAmount(calculateTotalLoanBalance(client))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <PiggyBank className="h-3 w-3" />
                      {formatAmount(calculateTotalSavingsBalance(client))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tenant/clients/${client.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {canActivateClient(client) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleActivateClient(client.id)}
                          disabled={activateClient.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-medium mb-2">No clients found</h3>
                <p className="text-muted-foreground mb-4">
                  No clients match your search "{searchTerm}". Try adjusting your search terms.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">Start building your client base by adding your first client.</p>
                <Button onClick={onCreateClient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Client
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>

      <CleanClientDetailsDialog
        client={selectedClient}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />

      <FullLoanApplicationDialog
        open={isLoanApplicationDialogOpen}
        onOpenChange={setIsLoanApplicationDialogOpen}
        preSelectedClientId={selectedClientForLoan}
        onApplicationCreated={handleLoanApplicationCreated}
      />
    </Card>
  );
};