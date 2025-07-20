import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

import { useDashboardData } from "@/hooks/useDashboardData";
import { 
  Users, 
  PiggyBank, 
  CreditCard, 
  UsersIcon, 
  UserPlus, 
  FileText, 
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const TenantDashboard = () => {
  const { stats, recentActivities, chartData, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      description: "+12% from last month",
      trend: 'up' as const,
      format: 'number' as const,
    },
    {
      title: "Active Loans",
      value: stats?.activeLoans || 0,
      description: "Total outstanding",
      trend: 'up' as const,
      format: 'number' as const,
    },
    {
      title: "Portfolio Value",
      value: stats?.totalPortfolio || 0,
      description: "Outstanding amount",
      trend: 'up' as const,
      format: 'currency' as const,
    },
    {
      title: "Savings Accounts",
      value: stats?.savingsAccounts || 0,
      description: "Active accounts",
      trend: 'stable' as const,
      format: 'number' as const,
    }
  ];

  const quickActions = [
    {
      title: "Add Client",
      description: "Register new client",
      icon: UserPlus,
      link: "/tenant/clients",
      color: "bg-blue-500",
    },
    {
      title: "Process Loan",
      description: "New loan application",
      icon: CreditCard,
      link: "/tenant/loans",
      color: "bg-green-500",
    },
    {
      title: "Record Payment",
      description: "Log payment received",
      icon: DollarSign,
      link: "/tenant/transactions",
      color: "bg-purple-500",
    },
    {
      title: "View Reports",
      description: "Generate reports",
      icon: FileText,
      link: "/tenant/reports",
      color: "bg-orange-500",
    },
  ];

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('loan')) return CreditCard;
    if (type.includes('savings')) return PiggyBank;
    if (type.includes('payment')) return DollarSign;
    return FileText;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your LoanSpur CBS tenant portal</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/tenant/clients">
              <Users className="mr-2 h-4 w-4" />
              Manage Clients
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <DashboardKPIs kpis={kpis} />
        <DashboardCharts {...chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest transactions and activities in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity, index) => {
                  const Icon = getActivityIcon(activity.transaction_type);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {formatTransactionType(activity.transaction_type)}
                          {activity.clients && (
                            <span className="text-muted-foreground">
                              {" "}from {activity.clients.first_name} {activity.clients.last_name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()} • ${activity.amount.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.transaction_type}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} to={action.link}>
                    <Card className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{action.title}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantDashboard;