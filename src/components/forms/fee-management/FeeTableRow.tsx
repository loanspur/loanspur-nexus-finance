import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { Fee } from "./types";

interface FeeTableRowProps {
  fee: Fee;
  onEdit: (fee: Fee) => void;
  onDelete: (feeId: string) => void;
}

export const FeeTableRow = ({ fee, onEdit, onDelete }: FeeTableRowProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'loan':
        return 'bg-blue-100 text-blue-800';
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'account':
        return 'bg-purple-100 text-purple-800';
      case 'transaction':
        return 'bg-orange-100 text-orange-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatApplicableFor = (applicableFor: string) => {
    return applicableFor.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{fee.name}</p>
          {fee.description && (
            <p className="text-sm text-muted-foreground">{fee.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getCategoryColor(fee.category)}>
          {formatCategory(fee.category)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {fee.type === 'percentage' ? (
            <Percent className="h-4 w-4" />
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
          {formatType(fee.type)}
        </div>
      </TableCell>
      <TableCell className="font-semibold">
        {fee.type === 'percentage' ? `${fee.amount}%` : `KSh ${fee.amount}`}
      </TableCell>
      <TableCell>
        <Badge variant={fee.isActive ? "default" : "secondary"}>
          {fee.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        {formatApplicableFor(fee.applicableFor)}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(fee)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(fee.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};