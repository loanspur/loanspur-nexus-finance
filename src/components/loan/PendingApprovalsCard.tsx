import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePendingApprovals } from "@/hooks/useApprovalRequests";
import { LoanApprovalDialog } from "./LoanApprovalDialog";
import { Bell, FileText, DollarSign, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const PendingApprovalsCard = () => {
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: pendingApprovals, isLoading } = usePendingApprovals();

  const handleApprovalClick = (approval: any) => {
    setSelectedApproval(approval);
    setDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'normal':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Pending Approvals
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {pendingApprovals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingApprovals || pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {approval.workflow?.action_type?.replace('_', ' ').toUpperCase()}
                        </span>
                        <Badge variant={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {approval.requester?.first_name} {approval.requester?.last_name}
                        </span>
                      </div>
                      
                      {approval.record_data && typeof approval.record_data === 'object' && 
                       'requested_amount' in approval.record_data && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>${(approval.record_data.requested_amount as number).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {approval.reason && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {approval.reason}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApprovalClick(approval)}
                      className="w-full"
                    >
                      Review & Approve
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <LoanApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        approvalRequest={selectedApproval}
      />
    </>
  );
};