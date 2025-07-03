import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGroupManagement, GroupMeeting, GroupLoanApplication, GroupSavingsAccount, GroupPerformanceMetrics } from "@/hooks/useGroupManagement";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, Users, CreditCard, PiggyBank, TrendingUp, Plus, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";

const GroupManagementPage = () => {
  const {
    loading,
    fetchGroupMeetings,
    createGroupMeeting,
    fetchGroupLoanApplications,
    fetchGroupSavingsAccounts,
    generateGroupPerformanceMetrics,
    fetchGroupPerformanceMetrics
  } = useGroupManagement();

  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [loanApplications, setLoanApplications] = useState<GroupLoanApplication[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<GroupSavingsAccount[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<GroupPerformanceMetrics[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  // Dialog states
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false);

  // Form states
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  const loadData = async () => {
    const [meetingsData, loansData, savingsData, metricsData] = await Promise.all([
      fetchGroupMeetings(selectedGroup || undefined),
      fetchGroupLoanApplications(selectedGroup || undefined),
      fetchGroupSavingsAccounts(selectedGroup || undefined),
      fetchGroupPerformanceMetrics(selectedGroup || undefined)
    ]);
    
    setMeetings(meetingsData);
    setLoanApplications(loansData);
    setSavingsAccounts(savingsData);
    setPerformanceMetrics(metricsData);
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingDate || !meetingTime || !selectedGroup) return;

    // Using default meeting type ID - in real implementation, this would be selected
    const defaultMeetingTypeId = "default-meeting-type-id";
    
    const meeting = await createGroupMeeting(
      selectedGroup,
      defaultMeetingTypeId,
      meetingTitle,
      meetingDate,
      meetingTime,
      90, // default duration
      meetingLocation,
      meetingAgenda
    );
    
    if (meeting) {
      setMeetings(prev => [meeting, ...prev]);
      setIsMeetingDialogOpen(false);
      resetMeetingForm();
    }
  };

  const resetMeetingForm = () => {
    setMeetingTitle('');
    setMeetingDate('');
    setMeetingTime('');
    setMeetingLocation('');
    setMeetingAgenda('');
  };

  const handleGenerateMetrics = async () => {
    if (!selectedGroup) return;
    
    const metrics = await generateGroupPerformanceMetrics(selectedGroup);
    if (metrics) {
      setPerformanceMetrics(prev => [metrics, ...prev.filter(m => m.group_id !== selectedGroup)]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderPerformanceCharts = () => {
    if (performanceMetrics.length === 0) return null;

    const latest = performanceMetrics[0];
    const attendanceData = [
      { name: 'Present', value: latest.meeting_attendance_rate },
      { name: 'Absent', value: 100 - latest.meeting_attendance_rate }
    ];

    const savingsProgressData = [
      { name: 'Achieved', value: latest.savings_target_achievement },
      { name: 'Remaining', value: 100 - latest.savings_target_achievement }
    ];

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Target Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={savingsProgressData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {savingsProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Group Management</h1>
          <p className="text-muted-foreground">Manage group activities, meetings, loans, and savings</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Groups</SelectItem>
              <SelectItem value="group-1">Sample Group 1</SelectItem>
              <SelectItem value="group-2">Sample Group 2</SelectItem>
            </SelectContent>
          </Select>
          {selectedGroup && (
            <Button onClick={handleGenerateMetrics} variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Metrics
            </Button>
          )}
        </div>
      </div>

      {selectedGroup && performanceMetrics.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{performanceMetrics[0].active_members}</div>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">${performanceMetrics[0].total_savings_balance.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{performanceMetrics[0].meeting_attendance_rate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{performanceMetrics[0].group_solidarity_score.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Solidarity Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="meetings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="loans">Group Loans</TabsTrigger>
          <TabsTrigger value="savings">Group Savings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Group Meetings</h2>
            <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedGroup}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Group Meeting</DialogTitle>
                  <DialogDescription>
                    Create a new meeting for the selected group
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meetingTitle">Meeting Title</Label>
                    <Input
                      id="meetingTitle"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="Enter meeting title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meetingDate">Date</Label>
                      <Input
                        id="meetingDate"
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="meetingTime">Time</Label>
                      <Input
                        id="meetingTime"
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="meetingLocation">Location</Label>
                    <Input
                      id="meetingLocation"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      placeholder="Meeting location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meetingAgenda">Agenda</Label>
                    <Textarea
                      id="meetingAgenda"
                      value={meetingAgenda}
                      onChange={(e) => setMeetingAgenda(e.target.value)}
                      placeholder="Meeting agenda"
                    />
                  </div>
                  <Button onClick={handleCreateMeeting} disabled={loading} className="w-full">
                    {loading ? 'Scheduling...' : 'Schedule Meeting'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{meeting.meeting_title}</CardTitle>
                      <CardDescription>
                        {format(new Date(meeting.meeting_date), 'PPP')} at {meeting.meeting_time}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(meeting.status)}
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{meeting.duration_minutes} minutes</span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{meeting.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {meeting.meeting_attendance?.length || 0} attendees
                      </span>
                    </div>
                  </div>
                  {meeting.agenda && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1">Agenda</h4>
                      <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Group Loan Applications</h2>
            <Button disabled={!selectedGroup}>
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </div>

          <div className="grid gap-4">
            {loanApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{application.application_number}</CardTitle>
                      <CardDescription>
                        {application.groups?.name} - ${application.requested_amount.toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(application.status)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Purpose:</span>
                      <span>{application.loan_purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span>{application.group_loan_products?.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applied:</span>
                      <span>{format(new Date(application.applied_at), 'PPP')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member Allocations:</span>
                      <span>{application.group_loan_member_allocations?.length || 0} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Group Savings Accounts</h2>
            <Button disabled={!selectedGroup}>
              <Plus className="w-4 h-4 mr-2" />
              New Savings Account
            </Button>
          </div>

          <div className="grid gap-4">
            {savingsAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <PiggyBank className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{account.account_name}</CardTitle>
                      <CardDescription>
                        {account.account_number} - {account.account_type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    ${account.current_balance.toLocaleString()}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Target Amount:</span>
                      <span>${account.target_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span>{account.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Contribution:</span>
                      <span>${account.minimum_contribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contribution Frequency:</span>
                      <span>{account.contribution_frequency?.replace('_', ' ') || 'Not set'}</span>
                    </div>
                    {account.target_amount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{((account.current_balance / account.target_amount) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (account.current_balance / account.target_amount) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Group Performance Analytics</h2>
          </div>

          {renderPerformanceCharts()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupManagementPage;