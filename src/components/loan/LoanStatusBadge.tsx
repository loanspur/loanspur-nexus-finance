import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Banknote, 
  AlertCircle,
  AlertTriangle,
  Eye,
  CreditCard,
  Pause
} from "lucide-react";
import { getStatusConfig } from "@/lib/status-management";

interface LoanStatusBadgeProps {
  status: string;
  size?: 'sm' | 'default' | 'lg';
}

// Icon mapping for status display
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Clock: <Clock className="h-3 w-3" />,
  CheckCircle: <CheckCircle className="h-3 w-3" />,
  XCircle: <XCircle className="h-3 w-3" />,
  Banknote: <Banknote className="h-3 w-3" />,
  AlertCircle: <AlertCircle className="h-3 w-3" />,
  AlertTriangle: <AlertTriangle className="h-3 w-3" />,
  Eye: <Eye className="h-3 w-3" />,
  CreditCard: <CreditCard className="h-3 w-3" />,
  Pause: <Pause className="h-3 w-3" />
};

export const LoanStatusBadge = ({ status, size = 'default' }: LoanStatusBadgeProps) => {
  const config = getStatusConfig(status);
  const icon = STATUS_ICONS[config.iconName] || STATUS_ICONS.AlertCircle;
  
  return (
    <Badge 
      variant={config.badgeVariant} 
      className={`flex items-center gap-1 w-fit ${config.badgeClassName} ${
        size === 'sm' ? 'text-xs px-2 py-1' : 
        size === 'lg' ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'
      }`}
    >
      {icon}
      {config.displayText}
    </Badge>
  );
};