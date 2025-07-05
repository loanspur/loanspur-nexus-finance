import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type JournalEntry } from "@/hooks/useAccounting";

interface JournalEntryDetailsDialogProps {
  entry: JournalEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JournalEntryDetailsDialog = ({ entry, open, onOpenChange }: JournalEntryDetailsDialogProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      posted: { label: "Posted", variant: "default" as const },
      reversed: { label: "Reversed", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEntryTypeBadge = (type: string) => {
    const typeColors = {
      manual: "bg-blue-100 text-blue-800",
      automatic: "bg-green-100 text-green-800",
      adjusting: "bg-yellow-100 text-yellow-800",
      closing: "bg-purple-100 text-purple-800",
      accrual: "bg-orange-100 text-orange-800",
      provision: "bg-red-100 text-red-800",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || typeColors.manual;
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journal Entry Details - {entry.entry_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entry Number</label>
                  <p className="font-medium">{entry.entry_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p>{format(new Date(entry.transaction_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div>{entry.reference_type ? getEntryTypeBadge(entry.reference_type) : "-"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>{getStatusBadge(entry.status)}</div>
                </div>
                {entry.reference_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reference ID</label>
                    <p>{entry.reference_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="font-medium">{entry.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                {entry.approved_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Approved</label>
                    <p>{format(new Date(entry.approved_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
              </div>
              
              {entry.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{entry.description}</p>
                </div>
              )}
              
            </CardContent>
          </Card>

          {/* Entry Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Entry Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.journal_entry_lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {line.account?.account_code} - {line.account?.account_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{line.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          {line.debit_amount > 0 ? line.debit_amount.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.credit_amount > 0 ? line.credit_amount.toFixed(2) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Totals */}
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-8">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-medium">{entry.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};