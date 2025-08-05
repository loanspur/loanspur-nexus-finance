import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface KPI {
  title: string;
  value: string | number;
  previousValue?: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

interface DashboardKPIsProps {
  kpis: KPI[];
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ kpis }) => {
  const { formatAmount } = useCurrency();
  
  const formatValue = (value: string | number, format?: string) => {
    if (format === 'currency' && typeof value === 'number') {
      return formatAmount(value);
    }
    if (format === 'percentage' && typeof value === 'number') {
      return `${value}%`;
    }
    if (format === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return value;
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      case 'stable':
        return 'text-muted-foreground';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className={`shadow-card hover:shadow-md transition-shadow ${kpi.className || ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            {getTrendIcon(kpi.trend)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrendColor(kpi.trend)}`}>
              {formatValue(kpi.value, kpi.format)}
            </div>
            {kpi.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};