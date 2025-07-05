import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit } from "lucide-react";
import { format } from "date-fns";
import { useAccruals, useDeleteAccrual, usePostAccrual, useReverseAccrual, type Accrual } from "@/hooks/useAccruals";
import { AccrualForm } from "./AccrualForm";

export const AccrualsTable = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    accrualType: "all",
    status: "all",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingAccrual, setEditingAccrual] = useState<Accrual | undefined>();

  const { data: accruals, isLoading } = useAccruals();
  const deleteAccrual = useDeleteAccrual();
  const postAccrual = usePostAccrual();
  const reverseAccrual = useReverseAccrual();

  const filteredAccruals = accruals?.filter((accrual) => {
    const matchesSearch = accrual.accrual_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         accrual.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         accrual.account.account_name.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesType = filters.accrualType === "all" || accrual.accrual_type === filters.accrualType;
    const matchesStatus = filters.status === "all" || accrual.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      posted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      reversed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    return <Badge className={colorClass}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      expense: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      revenue: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      liability: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      asset: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleEdit = (accrual: Accrual) => {
    setEditingAccrual(accrual);
    setShowForm(true);
  };

  const handleDelete = async (accrualId: string) => {
    await deleteAccrual.mutateAsync(accrualId);
  };

  const handlePost = async (accrualId: string) => {
    await postAccrual.mutateAsync(accrualId);
  };

  const handleReverse = async (accrualId: string) => {
    await reverseAccrual.mutateAsync(accrualId);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccrual(undefined);
  };

  const getTotalsByStatus = () => {
    const totals = {
      pending: 0,
      posted: 0,
      reversed: 0,
      total: 0,
    };

    filteredAccruals.forEach(accrual => {
      totals.total += accrual.amount;
      switch (accrual.status) {
        case 'pending':
          totals.pending += accrual.amount;
          break;
        case 'posted':
          totals.posted += accrual.amount;
          break;
        case 'reversed':
          totals.reversed += accrual.amount;
          break;
      }
    });

    return totals;
  };

  const totals = getTotalsByStatus();

  if (isLoading) {
    return <div>Loading accruals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Accruals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.posted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reversed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.reversed)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Accruals Management</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              Create Accrual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accruals..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.accrualType} onValueChange={(value) => setFilters({ ...filters, accrualType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => setFilters({ searchTerm: "", accrualType: "all", status: "all" })}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accrual Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Contra Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Accrual Date</TableHead>
                  <TableHead>Reversal Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccruals.map((accrual) => (
                  <TableRow key={accrual.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{accrual.accrual_name}</div>
                        {accrual.description && (
                          <div className="text-sm text-muted-foreground">{accrual.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(accrual.accrual_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{accrual.account.account_code}</div>
                        <div className="text-muted-foreground">{accrual.account.account_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{accrual.contra_account.account_code}</div>
                        <div className="text-muted-foreground">{accrual.contra_account.account_name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(accrual.amount)}
                    </TableCell>
                    <TableCell>{format(new Date(accrual.accrual_date), 'PP')}</TableCell>
                    <TableCell>
                      {accrual.reversal_date ? format(new Date(accrual.reversal_date), 'PP') : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(accrual.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {accrual.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(accrual)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePost(accrual.id)}
                            >
                              Post
                            </Button>
                          </>
                        )}
                        {accrual.status === 'posted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReverse(accrual.id)}
                          >
                            Reverse
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Accrual</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{accrual.accrual_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(accrual.id)}
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
                {filteredAccruals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No accruals found. Create your first accrual to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AccrualForm
        open={showForm}
        onOpenChange={handleCloseForm}
        accrual={editingAccrual}
      />
    </div>
  );
};