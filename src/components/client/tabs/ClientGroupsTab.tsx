import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, MapPin, Phone, UserPlus, UserMinus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Group {
  id: string;
  name: string;
  group_number: string;
  meeting_frequency: string;
  meeting_day: string;
  meeting_time: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  group_id?: string | null;
}

interface ClientGroupsTabProps {
  client: Client;
}

export const ClientGroupsTab = ({ client }: ClientGroupsTabProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Mock groups data - in real app, this would come from the groups table
  const availableGroups: Group[] = [
    {
      id: "group1",
      name: "Women Entrepreneurs Group",
      group_number: "WEG-001",
      meeting_frequency: "weekly",
      meeting_day: "Tuesday",
      meeting_time: "14:00",
      is_active: true,
      created_at: "2024-01-15T00:00:00Z",
      member_count: 12
    },
    {
      id: "group2", 
      name: "Small Business Collective",
      group_number: "SBC-002",
      meeting_frequency: "bi-weekly",
      meeting_day: "Friday",
      meeting_time: "10:00",
      is_active: true,
      created_at: "2024-02-20T00:00:00Z",
      member_count: 8
    },
    {
      id: "group3",
      name: "Agricultural Cooperative",
      group_number: "AC-003",
      meeting_frequency: "monthly",
      meeting_day: "Saturday",
      meeting_time: "09:00",
      is_active: true,
      created_at: "2024-03-10T00:00:00Z",
      member_count: 15
    }
  ];

  const currentGroup = availableGroups.find(g => g.id === (client as any).group_id);

  const handleJoinGroup = async () => {
    if (!selectedGroup) {
      toast({
        title: "Error",
        description: "Please select a group to join",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      // For demo purposes, just show success message
      // In real implementation, you'd update the clients table
      console.log('Adding client to group:', selectedGroup);

      toast({
        title: "Success",
        description: "Group membership updated successfully (demo mode)",
      });

      setSelectedGroup("");

    } catch (error) {
      console.error('Group assignment error:', error);
      toast({
        title: "Error", 
        description: "Failed to update group membership (demo mode)",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveGroup = async () => {
    setUpdating(true);
    try {
      // For demo purposes, just show success message
      console.log('Removing client from group');

      toast({
        title: "Success",
        description: "Client removed from group successfully (demo mode)",
      });

    } catch (error) {
      console.error('Group removal error:', error);
      toast({
        title: "Error", 
        description: "Failed to remove from group (demo mode)",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Group Membership */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Group Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentGroup ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{currentGroup.name}</h3>
                    <p className="text-sm text-muted-foreground">Group #{currentGroup.group_number}</p>
                    <Badge variant="default" className="mt-1">Active Member</Badge>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLeaveGroup} disabled={updating}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave Group
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Meets {currentGroup.meeting_frequency} on {currentGroup.meeting_day}s</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>Meeting time: {currentGroup.meeting_time}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Members</Label>
                    <p className="text-lg font-semibold">{currentGroup.member_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Group Since</Label>
                    <p className="text-sm">
                      {format(new Date(currentGroup.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Not a Member of Any Group</h3>
              <p className="text-muted-foreground mb-4">This client is not currently a member of any group.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Membership Rules */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Each client can only be a member of one group at a time. If you join a new group, 
          you will automatically be removed from your current group.
        </AlertDescription>
      </Alert>

      {/* Join New Group */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {currentGroup ? 'Change Group Membership' : 'Join a Group'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="group">Select Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a group to join" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups
                  .filter(group => group.id !== currentGroup?.id)
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">#{group.group_number}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{group.member_count} members</p>
                          <p className="text-muted-foreground">{group.meeting_frequency}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleJoinGroup}
            disabled={updating || !selectedGroup}
            className="w-full"
          >
            {updating ? "Updating..." : currentGroup ? "Change Group" : "Join Group"}
          </Button>
        </CardContent>
      </Card>

      {/* Group History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Group Membership History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentGroup && (
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Joined {currentGroup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current membership
                  </p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Individual Client Status</p>
                <p className="text-sm text-muted-foreground">
                  {currentGroup ? 'Before group membership' : 'Current status'}
                </p>
              </div>
              <Badge variant={currentGroup ? "secondary" : "default"}>
                {currentGroup ? 'Previous' : 'Current'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};