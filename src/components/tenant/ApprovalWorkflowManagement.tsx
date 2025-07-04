import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Settings, CheckCircle, XCircle, Clock } from "lucide-react";
import { 
  useApprovalWorkflows, 
  useApprovalWorkflowTypes,
  useDeleteApprovalWorkflow,
  ApprovalWorkflow 
} from "@/hooks/useApprovalWorkflows";
import { CreateApprovalWorkflowDialog } from "./CreateApprovalWorkflowDialog";
import { EditApprovalWorkflowDialog } from "./EditApprovalWorkflowDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ApprovalWorkflowManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);

  const { data: workflows = [], isLoading, refetch } = useApprovalWorkflows();
  const { data: workflowTypes = [] } = useApprovalWorkflowTypes();
  const deleteWorkflowMutation = useDeleteApprovalWorkflow();

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.workflow_type?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground";
  };

  const getApprovalOrderBadge = (order: string) => {
    const colors = {
      sequential: "bg-blue-100 text-blue-800",
      any: "bg-green-100 text-green-800",
      all: "bg-orange-100 text-orange-800"
    };
    return colors[order as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    setEditDialogOpen(true);
  };

  const handleDeleteWorkflow = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedWorkflow) {
      await deleteWorkflowMutation.mutateAsync(selectedWorkflow.id);
      setDeleteDialogOpen(false);
      setSelectedWorkflow(null);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Approval Workflow Management
          </h2>
          <p className="text-muted-foreground">Configure maker-checker approval processes</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflow Types</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowTypes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Workflows</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => !w.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Workflow Type</TableHead>
                  <TableHead>Min Approvers</TableHead>
                  <TableHead>Approval Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading workflows...
                    </TableCell>
                  </TableRow>
                ) : filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No approval workflows found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">
                        {workflow.action_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{workflow.table_name}</TableCell>
                      <TableCell>
                        {workflow.workflow_type?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{workflow.minimum_approvers}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getApprovalOrderBadge(workflow.approval_order)}
                        >
                          {workflow.approval_order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={workflow.is_active ? "default" : "secondary"}
                          className={getStatusBadgeColor(workflow.is_active)}
                        >
                          {workflow.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(workflow.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWorkflow(workflow)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorkflow(workflow)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateApprovalWorkflowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      <EditApprovalWorkflowDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workflow={selectedWorkflow}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedWorkflow(null);
          refetch();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Approval Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the workflow for "{selectedWorkflow?.action_type}"? 
              This action cannot be undone and will affect any pending approvals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};