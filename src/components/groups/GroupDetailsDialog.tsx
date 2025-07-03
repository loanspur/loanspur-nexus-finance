import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  PiggyBank, 
  CreditCard,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Settings
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  group_number: string;
  meeting_frequency?: string;
  meeting_day?: string;
  meeting_time?: string;
  is_active: boolean;
  created_at: string;
  mifos_group_id?: number;
}

interface GroupDetailsDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupDetailsDialog = ({ 
  group, 
  open, 
  onOpenChange 
}: GroupDetailsDialogProps) => {
  if (!group) return null;

  const handleAddMembers = () => {
    // TODO: Implement add members functionality
    console.log("Add members to group:", group.id);
  };

  const handleScheduleMeeting = () => {
    // TODO: Implement schedule meeting functionality
    console.log("Schedule meeting for group:", group.id);
  };

  const handleManageSavings = () => {
    // TODO: Implement savings management
    console.log("Manage savings for group:", group.id);
  };

  const handleManageLoans = () => {
    // TODO: Implement loan management
    console.log("Manage loans for group:", group.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {group.name} - {group.group_number}
          </DialogTitle>
          <DialogDescription>
            Comprehensive group management and member activities
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Group Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Number:</span>
                    <span className="font-medium">{group.group_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meeting Frequency:</span>
                    <span>{group.meeting_frequency ? group.meeting_frequency.replace('_', ' ') : 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meeting Day:</span>
                    <span>{group.meeting_day || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meeting Time:</span>
                    <span>{group.meeting_time || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(group.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={group.is_active ? "default" : "secondary"}>
                      {group.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Activities */}
            <Tabs defaultValue="members" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="loans">Loans</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Group Members</span>
                      <Button onClick={handleAddMembers} size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Members
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: Display actual group members */}
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>No members found</p>
                      <p className="text-sm">Add members to get started</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meetings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Meetings</span>
                      <Button onClick={handleScheduleMeeting} size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: Display actual meetings */}
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4" />
                      <p>No meetings scheduled</p>
                      <p className="text-sm">Schedule your first meeting</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="savings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Group Savings</span>
                      <Button onClick={handleManageSavings} size="sm">
                        <PiggyBank className="h-4 w-4 mr-2" />
                        Manage Savings
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: Display actual savings data */}
                    <div className="text-center py-8 text-muted-foreground">
                      <PiggyBank className="h-12 w-12 mx-auto mb-4" />
                      <p>No savings accounts</p>
                      <p className="text-sm">Set up group savings to start collecting</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Group Loans</span>
                      <Button onClick={handleManageLoans} size="sm">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Loans
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: Display actual loan data */}
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4" />
                      <p>No loan applications</p>
                      <p className="text-sm">Apply for group loans when needed</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Savings:</span>
                    <span className="font-medium">USD 0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Loans:</span>
                    <span className="font-medium">USD 0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Meeting Attendance:</span>
                    <span className="font-medium">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleAddMembers} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </Button>
                <Button 
                  onClick={handleScheduleMeeting} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button 
                  onClick={handleManageSavings} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Manage Savings
                </Button>
                <Button 
                  onClick={handleManageLoans} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Loans
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};