import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GroupForm } from "@/components/forms/GroupForm";
import { GroupMemberForm } from "@/components/forms/GroupMemberForm";
import { GroupDetailsDialog } from "@/components/groups/GroupDetailsDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Search, Filter, Download, Plus, Eye, UserPlus, Calendar, PiggyBank, CreditCard } from "lucide-react";
import { format } from "date-fns";

const GroupsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { profile } = useAuth();

  // Fetch groups with member count and basic stats
  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['groups-with-stats', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      try {
        // Get groups with member information
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select(`
            *,
            group_members (
              id,
              is_active,
              clients (
                id,
                first_name,
                last_name,
                client_number,
                loans (
                  outstanding_balance,
                  status
                ),
                savings_accounts (
                  account_balance
                )
              )
            )
          `)
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false });

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
          return [];
        }

        // Process and calculate statistics for each group
        return groupsData?.map(group => {
          const activeMembers = group.group_members?.filter(m => m.is_active) || [];
          
          // Calculate total loans and savings from member data
          let totalLoans = 0;
          let totalSavings = 0;
          let activeLoansCount = 0;
          
          activeMembers.forEach(member => {
            if (member.clients) {
              // Sum up member loans (check for approved status)
              const memberLoans = member.clients.loans?.filter(loan => 
                loan.status === 'approved'
              ) || [];
              totalLoans += memberLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
              activeLoansCount += memberLoans.length;
              
              // Sum up member savings
              const memberSavings = member.clients.savings_accounts || [];
              totalSavings += memberSavings.reduce((sum, account) => sum + (account.account_balance || 0), 0);
            }
          });
          
          return {
            ...group,
            memberCount: activeMembers.length,
            totalSavings,
            totalLoans,
            activeLoans: activeLoansCount,
            office: 'Main Branch', // Default office - you can modify this based on your data structure
            loanOfficer: 'Jane Wanjiku', // Default loan officer - you can modify this based on your data structure
            members: activeMembers,
          };
        }) || [];
      } catch (error) {
        console.error('Error in groups query:', error);
        return [];
      }
    },
    enabled: !!profile?.tenant_id,
  });

  // Calculate KPIs
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);
  const totalSavings = groups.reduce((sum, g) => sum + g.totalSavings, 0);
  const totalLoans = groups.reduce((sum, g) => sum + g.totalLoans, 0);

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    searchTerm === "" || 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.group_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewGroup = (group: any) => {
    setSelectedGroup(group);
    setDetailsOpen(true);
  };

  const handleGroupCreated = () => {
    refetchGroups();
  };

  const handleMembersAdded = () => {
    refetchGroups();
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Group Management</h1>
          <p className="text-muted-foreground">Manage community groups and their activities</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={memberFormOpen} onOpenChange={setMemberFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <GroupMemberForm 
                open={memberFormOpen} 
                onOpenChange={setMemberFormOpen}
                onSuccess={handleMembersAdded}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={groupFormOpen} onOpenChange={setGroupFormOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <GroupForm 
                open={groupFormOpen} 
                onOpenChange={setGroupFormOpen}
                onSuccess={handleGroupCreated}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">{activeGroups} active groups</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Group Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">USD {totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total collected</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Group Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">USD {totalLoans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Group Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Members per group</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Groups
          </CardTitle>
          <CardDescription>Complete overview of community groups</CardDescription>
          <div className="flex gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search groups..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No groups found</p>
              <p className="text-sm text-muted-foreground">Create your first group to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Group Name</th>
                    <th className="text-left p-4 font-medium">Group Number</th>
                    <th className="text-left p-4 font-medium">Office</th>
                    <th className="text-left p-4 font-medium">Loan Officer</th>
                    <th className="text-center p-4 font-medium">Members</th>
                    <th className="text-right p-4 font-medium">Total Loans</th>
                    <th className="text-right p-4 font-medium">Total Savings</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-center p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: {format(new Date(group.created_at), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{group.group_number}</td>
                      <td className="p-4 text-sm">{group.office}</td>
                      <td className="p-4 text-sm">{group.loanOfficer}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="font-medium">
                          {group.memberCount}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        USD {group.totalLoans.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-medium text-success">
                        USD {group.totalSavings.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewGroup(group)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Details Dialog */}
      <GroupDetailsDialog
        group={selectedGroup}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};

export default GroupsPage;