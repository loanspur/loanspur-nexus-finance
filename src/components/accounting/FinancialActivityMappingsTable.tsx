import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, Plus } from "lucide-react";
import { useFinancialActivityMappings, useDeleteFinancialActivityMapping, type FinancialActivityMapping } from "@/hooks/useFinancialActivityMappings";
import { FinancialActivityMappingForm } from "./FinancialActivityMappingForm";

export const FinancialActivityMappingsTable = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    mappingType: "all",
    status: "all",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<FinancialActivityMapping | undefined>();

  const { data: mappings, isLoading } = useFinancialActivityMappings();
  const deleteMapping = useDeleteFinancialActivityMapping();

  const filteredMappings = mappings?.filter((mapping) => {
    const matchesSearch = mapping.activity_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         mapping.activity_code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         mapping.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesType = filters.mappingType === "all" || mapping.mapping_type === filters.mappingType;
    const matchesStatus = filters.status === "all" || 
                         (filters.status === "active" && mapping.is_active) ||
                         (filters.status === "inactive" && !mapping.is_active);

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getTypeBadge = (type: string) => {
    const typeColors = {
      income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      expense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      asset: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      liability: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      equity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  const handleEdit = (mapping: FinancialActivityMapping) => {
    setEditingMapping(mapping);
    setShowForm(true);
  };

  const handleDelete = async (mappingId: string) => {
    await deleteMapping.mutateAsync(mappingId);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMapping(undefined);
  };

  if (isLoading) {
    return <div>Loading financial activity mappings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Financial Activity Mappings</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Define New Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mappings..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.mappingType} onValueChange={(value) => setFilters({ ...filters, mappingType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
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
              onClick={() => setFilters({ searchTerm: "", mappingType: "all", status: "all" })}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Activity Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mapped Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mapping.activity_name}</div>
                        {mapping.description && (
                          <div className="text-sm text-muted-foreground">{mapping.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mapping.activity_code}</Badge>
                    </TableCell>
                    <TableCell>{getTypeBadge(mapping.mapping_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{mapping.account.account_code}</div>
                        <div className="text-muted-foreground">{mapping.account.account_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Financial Activity Mapping</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{mapping.activity_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(mapping.id)}
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
                {filteredMappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No financial activity mappings found. Define your first mapping to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FinancialActivityMappingForm
        open={showForm}
        onOpenChange={handleCloseForm}
        mapping={editingMapping}
      />
    </div>
  );
};