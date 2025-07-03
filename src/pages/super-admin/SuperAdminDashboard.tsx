import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTenants } from "@/hooks/useSupabase";
import { Building2, Users, DollarSign, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const SuperAdminDashboard = () => {
  const { stats, recentActivities, chartData, isLoading } = useDashboardData();
  const { data: tenants, isLoading: tenantsLoading } = useTenants();

  if (isLoading || tenantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeTenants = tenants?.filter(t => t.status === 'active').length || 0;
  const trialTenants = tenants?.filter(t => t.status === 'active' && t.trial_ends_at).length || 0;
  const totalRevenue = activeTenants * 352; // Mock calculation
  
  const kpis = [
    {
      title: "Active Tenants",
      value: activeTenants,
      description: `+${Math.floor(activeTenants * 0.12)} from last month`,
      trend: 'up' as const,
      format: 'number' as const,
    },
    {
      title: "Total Revenue",
      value: totalRevenue,
      description: "Monthly recurring revenue",
      trend: 'up' as const,
      format: 'currency' as const,
    },
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      description: "Across all tenants",
      trend: 'up' as const,
      format: 'number' as const,
    },
    {
      title: "System Health",
      value: "99.9",
      description: "Uptime this month",
      trend: 'stable' as const,
      format: 'percentage' as const,
    }
  ];

  const systemMetrics = [
    { label: "Conversion Rate (Trial → Paid)", value: "68%", icon: TrendingUp },
    { label: "Average Revenue Per Tenant", value: "$352/month", icon: DollarSign },
    { label: "Support Tickets (Open)", value: "3", icon: AlertTriangle },
    { label: "API Calls (Last 24h)", value: "124,891", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and system metrics</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/super-admin/tenants">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Tenants
            </Link>
          </Button>
        </div>
      </div>

      <DashboardKPIs kpis={kpis} />

      <DashboardCharts {...chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recent Tenants
            </CardTitle>
            <CardDescription>Latest organizations to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenants?.slice(0, 5).map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(tenant.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{tenant.pricing_tier}</Badge>
                    <Badge 
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Metrics
            </CardTitle>
            <CardDescription>Key platform performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className="font-semibold">{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;