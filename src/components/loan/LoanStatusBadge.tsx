import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Banknote, 
  AlertCircle,
  AlertTriangle,
  Eye,
  CreditCard
} from "lucide-react";

interface LoanStatusBadgeProps {
  status: string;
  size?: 'sm' | 'default' | 'lg';
}

export const LoanStatusBadge = ({ status, size = 'default' }: LoanStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'PENDING',
          className: 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20'
        };
      case 'under_review':
        return {
          variant: 'outline' as const,
          icon: <Eye className="h-3 w-3" />,
          text: 'UNDER REVIEW',
          className: 'bg-info/10 text-banking-primary border border-banking-primary/20 hover:bg-info/20'
        };
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'APPROVED',
          className: 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
        };
      case 'pending_disbursement':
        return {
          variant: 'default' as const,
          icon: <CreditCard className="h-3 w-3" />,
          text: 'PENDING DISBURSEMENT',
          className: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
        };
      case 'disbursed':
        return {
          variant: 'default' as const,
          icon: <Banknote className="h-3 w-3" />,
          text: 'DISBURSED',
          className: 'bg-banking-primary/10 text-banking-primary border border-banking-primary/20 hover:bg-banking-primary/20'
        };
      case 'active':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'ACTIVE',
          className: 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
        };
      case 'in_arrears':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'IN ARREARS',
          className: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
        };
      case 'overpaid':
        return {
          variant: 'outline' as const,
          icon: <Banknote className="h-3 w-3" />,
          text: 'OVERPAID',
          className: 'bg-banking-emerald/10 text-banking-emerald border border-banking-emerald/20 hover:bg-banking-emerald/20'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'REJECTED',
          className: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
        };
      case 'withdrawn':
        return {
          variant: 'secondary' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'WITHDRAWN',
          className: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: status.toUpperCase(),
          className: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 w-fit ${config.className} ${
        size === 'sm' ? 'text-xs px-2 py-1' : 
        size === 'lg' ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'
      }`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};