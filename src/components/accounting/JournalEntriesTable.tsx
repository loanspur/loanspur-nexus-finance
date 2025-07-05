import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye } from "lucide-react";
import { useJournalEntries, type JournalEntry } from "@/hooks/useAccounting";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalEntryDetailsDialog } from "./JournalEntryDetailsDialog";

export const JournalEntriesTable = () => {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "all",
    searchTerm: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const { data: journalEntries, isLoading } = useJournalEntries(filters);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      posted: { label: "Posted", variant: "default" as const },
      reversed: { label: "Reversed", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReferenceTypeBadge = (type?: string) => {
    if (!type) return null;
    const typeColors = {
      manual: "bg-blue-100 text-blue-800",
      loan: "bg-green-100 text-green-800",
      payment: "bg-yellow-100 text-yellow-800",
      adjustment: "bg-purple-100 text-purple-800",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || typeColors.manual;
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return <div>Loading journal entries...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Journal Entries</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => setFilters({ dateFrom: "", dateTo: "", status: "all", searchTerm: "" })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>{format(new Date(entry.transaction_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getReferenceTypeBadge(entry.reference_type)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell>{entry.reference_id || "-"}</TableCell>
                    <TableCell className="text-right">{entry.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!journalEntries || journalEntries.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No journal entries found. Create your first entry to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <JournalEntryForm open={showForm} onOpenChange={setShowForm} />
      
      {selectedEntry && (
        <JournalEntryDetailsDialog
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
        />
      )}
    </div>
  );
};