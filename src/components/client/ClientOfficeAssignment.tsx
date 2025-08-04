import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useOffices } from "@/hooks/useOfficeManagement";
import { useClientOfficeAssignments, useAssignClientToOffice, useRemoveClientFromOffice } from "@/hooks/useClientOfficeAssignment";
import { Building2, Plus, Trash2 } from "lucide-react";

interface ClientOfficeAssignmentProps {
  clientId: string;
}

export const ClientOfficeAssignment = ({ clientId }: ClientOfficeAssignmentProps) => {
  const [open, setOpen] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: offices = [] } = useOffices();
  const { data: assignments = [] } = useClientOfficeAssignments(clientId);
  const assignMutation = useAssignClientToOffice();
  const removeMutation = useRemoveClientFromOffice();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeId) return;

    await assignMutation.mutateAsync({
      client_id: clientId,
      office_id: selectedOfficeId,
      is_primary: isPrimary,
      assigned_date: assignedDate,
    });

    setOpen(false);
    setSelectedOfficeId("");
    setIsPrimary(false);
    setAssignedDate(new Date().toISOString().split('T')[0]);
  };

  const handleRemove = async (assignmentId: string) => {
    if (confirm("Are you sure you want to remove this office assignment?")) {
      await removeMutation.mutateAsync(assignmentId);
    }
  };

  const getOfficeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'head_office': return 'default';
      case 'branch': return 'secondary';
      case 'sub_branch': return 'outline';
      case 'collection_center': return 'destructive';
      default: return 'outline';
    }
  };

  const getOfficeTypeLabel = (type: string) => {
    switch (type) {
      case 'head_office': return 'Head Office';
      case 'branch': return 'Branch';
      case 'sub_branch': return 'Sub Branch';
      case 'collection_center': return 'Collection Center';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Office Assignments
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Assign to Office
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Client to Office</DialogTitle>
              <DialogDescription>
                Assign this client to an office. Clients can be assigned to multiple offices.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <Label htmlFor="office">Office</Label>
                <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name} ({office.office_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned-date">Assigned Date</Label>
                <Input
                  id="assigned-date"
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-primary"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
                <Label htmlFor="is-primary">Primary Assignment</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedOfficeId || assignMutation.isPending}>
                  {assignMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No office assignments found.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{assignment.office?.office_name}</span>
                  <Badge variant={getOfficeTypeBadgeColor(assignment.office?.office_type || '')}>
                    {getOfficeTypeLabel(assignment.office?.office_type || '')}
                  </Badge>
                  {assignment.is_primary && (
                    <Badge variant="default">Primary</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Assigned on {new Date(assignment.assigned_date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(assignment.id)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};