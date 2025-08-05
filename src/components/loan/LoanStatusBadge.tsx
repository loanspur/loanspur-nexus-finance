import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Banknote, 
  AlertCircle,
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
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
        };
      case 'under_review':
        return {
          variant: 'outline' as const,
          icon: <Eye className="h-3 w-3" />,
          text: 'UNDER REVIEW',
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
        };
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'APPROVED',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };
      case 'pending_disbursement':
        return {
          variant: 'default' as const,
          icon: <CreditCard className="h-3 w-3" />,
          text: 'PENDING DISBURSEMENT',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
        };
      case 'disbursed':
        return {
          variant: 'default' as const,
          icon: <Banknote className="h-3 w-3" />,
          text: 'DISBURSED',
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'REJECTED',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };
      case 'withdrawn':
        return {
          variant: 'secondary' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'WITHDRAWN',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: status.toUpperCase(),
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
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