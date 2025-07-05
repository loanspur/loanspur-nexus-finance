import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useChartOfAccounts, useDeleteAccount, type ChartOfAccount } from "@/hooks/useChartOfAccounts";
import { ChartOfAccountForm } from "./ChartOfAccountForm";

export const ChartOfAccountsTable = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    accountType: "all",
    status: "all",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | undefined>();

  const { data: accounts, isLoading } = useChartOfAccounts();
  const deleteAccount = useDeleteAccount();

  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch = account.account_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         account.account_code.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesType = filters.accountType === "all" || account.account_type === filters.accountType;
    const matchesStatus = filters.status === "all" || 
                         (filters.status === "active" && account.is_active) ||
                         (filters.status === "inactive" && !account.is_active);

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getAccountTypeBadge = (type: string) => {
    const typeColors = {
      asset: "bg-green-100 text-green-800",
      liability: "bg-red-100 text-red-800",
      equity: "bg-blue-100 text-blue-800",
      revenue: "bg-purple-100 text-purple-800",
      expense: "bg-orange-100 text-orange-800",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800";
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (accountId: string) => {
    await deleteAccount.mutateAsync(accountId);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(undefined);
  };

  if (isLoading) {
    return <div>Loading chart of accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Chart of Accounts</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.accountType} onValueChange={(value) => setFilters({ ...filters, accountType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => setFilters({ searchTerm: "", accountType: "all", status: "all" })}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        {account.description && (
                          <div className="text-sm text-muted-foreground">{account.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getAccountTypeBadge(account.account_type)}</TableCell>
                    <TableCell className="capitalize">{account.account_category.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right">{account.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{account.account_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(account.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No accounts found. Create your first account to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ChartOfAccountForm
        open={showForm}
        onOpenChange={handleCloseForm}
        account={editingAccount}
        parentAccounts={accounts?.filter(acc => acc.id !== editingAccount?.id) || []}
      />
    </div>
  );
};