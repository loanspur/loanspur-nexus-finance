// Unified status badge component for all entities (loans, savings, etc.)
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
  Pause,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { getStatusConfig, getUnifiedLoanStatus } from "@/lib/status-management";

interface UnifiedStatusBadgeProps {
  status?: string;
  entity?: any; // For loans, this will trigger derived status calculation
  entityType?: 'loan' | 'savings' | 'general';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
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
  Pause: <Pause className="h-3 w-3" />,
  DollarSign: <DollarSign className="h-3 w-3" />,
  TrendingUp: <TrendingUp className="h-3 w-3" />,
  Sleep: <Pause className="h-3 w-3" /> // Fallback for dormant
};

export const UnifiedStatusBadge = ({ 
  status, 
  entity, 
  entityType = 'general', 
  size = 'default',
  showIcon = true 
}: UnifiedStatusBadgeProps) => {
  let finalStatus = status;
  let config;

  // For loans, use derived status logic
  if (entityType === 'loan' && entity) {
    const unified = getUnifiedLoanStatus(entity);
    finalStatus = unified.status;
    config = unified.config;
  } else if (finalStatus) {
    config = getStatusConfig(finalStatus);
  } else {
    config = getStatusConfig('unknown');
    finalStatus = 'unknown';
  }

  const icon = showIcon ? (STATUS_ICONS[config.iconName] || STATUS_ICONS.AlertCircle) : null;
  
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