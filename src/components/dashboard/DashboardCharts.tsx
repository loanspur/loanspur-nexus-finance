import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  [key: string]: any;
}

interface DashboardChartsProps {
  loanTrends?: ChartData[];
  portfolioDistribution?: ChartData[];
  monthlyPerformance?: ChartData[];
  riskAnalysis?: ChartData[];
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.destructive,
  COLORS.muted,
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  loanTrends = [],
  portfolioDistribution = [],
  monthlyPerformance = [],
  riskAnalysis = []
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Loan Portfolio Trends */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Loan Portfolio Trends</CardTitle>
          <CardDescription>Outstanding loans and disbursements over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={loanTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="outstanding" 
                stackId="1"
                stroke={COLORS.primary} 
                fill={COLORS.primary}
                fillOpacity={0.1}
                name="Outstanding"
              />
              <Area 
                type="monotone" 
                dataKey="disbursed" 
                stackId="2"
                stroke={COLORS.success} 
                fill={COLORS.success}
                fillOpacity={0.1}
                name="Disbursed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Portfolio Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
          <CardDescription>Loan distribution by product type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={portfolioDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {portfolioDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Collections vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Bar dataKey="target" fill={COLORS.muted} name="Target" />
              <Bar dataKey="actual" fill={COLORS.primary} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Portfolio Risk Analysis</CardTitle>
          <CardDescription>Loan performance and arrears</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="arrears" 
                stroke={COLORS.destructive} 
                strokeWidth={2}
                name="Arrears Rate"
              />
              <Line 
                type="monotone" 
                dataKey="writeoffs" 
                stroke={COLORS.warning} 
                strokeWidth={2}
                name="Write-off Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};