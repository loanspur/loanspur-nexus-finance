import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const GroupsPage = () => {
  const groups = [
    {
      id: "GRP-001",
      name: "Village Savings Group",
      leader: "Mary Johnson",
      members: [
        { name: "John Doe", savings: "$850", loan: "$1,800", overdue: "$0", disbursementDate: "2024-01-15", nextPayment: "2024-03-15", nextAmount: "$250" },
        { name: "Jane Smith", savings: "$450", loan: "$900", overdue: "$150", disbursementDate: "2024-02-10", nextPayment: "2024-02-28", nextAmount: "$150" },
        { name: "Bob Wilson", savings: "$650", loan: "$0", overdue: "$0", disbursementDate: "N/A", nextPayment: "N/A", nextAmount: "N/A" }
      ],
      totalSavings: "$1,950",
      totalLoans: "$2,700",
      totalOverdue: "$150",
      status: "Active",
      createdDate: "2024-01-10"
    },
    {
      id: "GRP-002", 
      name: "Women Entrepreneurs",
      leader: "Susan Brown",
      members: [
        { name: "Alice Green", savings: "$1,200", loan: "$2,500", overdue: "$0", disbursementDate: "2024-01-20", nextPayment: "2024-03-20", nextAmount: "$300" },
        { name: "Carol White", savings: "$800", loan: "$1,500", overdue: "$0", disbursementDate: "2024-02-01", nextPayment: "2024-03-01", nextAmount: "$200" }
      ],
      totalSavings: "$2,000",
      totalLoans: "$4,000", 
      totalOverdue: "$0",
      status: "Active",
      createdDate: "2024-01-25"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Group Management</h1>
          <p className="text-muted-foreground">Manage community groups and their activities</p>
        </div>
        <Button>Create New Group</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">34</div>
            <p className="text-xs text-muted-foreground">Active groups</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">456</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Group Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$89,450</div>
            <p className="text-xs text-muted-foreground">Total collected</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Group Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$156,700</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.id} className="shadow-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <CardDescription>
                    Leader: {group.leader} • Created: {group.createdDate} • ID: {group.id}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="default">{group.status}</Badge>
                  <Button variant="outline" size="sm">Download Report</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <div className="text-lg font-bold text-success">{group.totalSavings}</div>
                  <div className="text-sm text-muted-foreground">Total Savings</div>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">{group.totalLoans}</div>
                  <div className="text-sm text-muted-foreground">Total Loans</div>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-bold text-destructive">{group.totalOverdue}</div>
                  <div className="text-sm text-muted-foreground">Total Overdue</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-lg">Group Members</h4>
                {group.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.disbursementDate !== "N/A" && `Loan disbursed: ${member.disbursementDate}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-success">{member.savings}</div>
                        <div className="text-xs text-muted-foreground">Savings</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-primary">{member.loan}</div>
                        <div className="text-xs text-muted-foreground">Loan Balance</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`font-medium ${member.overdue !== "$0" ? "text-destructive" : "text-muted-foreground"}`}>
                          {member.overdue}
                        </div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{member.nextAmount}</div>
                        <div className="text-xs text-muted-foreground">Next Payment</div>
                        <div className="text-xs text-muted-foreground">{member.nextPayment}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;