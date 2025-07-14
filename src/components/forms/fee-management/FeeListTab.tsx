import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { FeeTableRow } from "./FeeTableRow";
import { Fee } from "./types";
import { useToast } from "@/hooks/use-toast";

// Mock existing fees
const existingFees: Fee[] = [
  {
    id: "fee_001",
    name: "Loan Processing Fee",
    type: "percentage",
    amount: 2.5,
    category: "loan",
    description: "Fee charged for processing new loan applications",
    isActive: true,
    applicableFor: "all",
    chargeTimeType: "upfront",
    chargePaymentBy: "regular"
  },
  {
    id: "fee_002",
    name: "Account Maintenance Fee",
    type: "fixed",
    amount: 100,
    category: "account",
    description: "Monthly account maintenance fee",
    isActive: true,
    applicableFor: "all",
    chargeTimeType: "monthly",
    chargePaymentBy: "automatic"
  },
  {
    id: "fee_003",
    name: "Late Payment Penalty",
    type: "percentage",
    amount: 1.0,
    category: "penalty",
    description: "Penalty for late loan repayments",
    isActive: true,
    applicableFor: "all",
    chargeTimeType: "late_payment",
    chargePaymentBy: "system"
  },
  {
    id: "fee_004",
    name: "Early Withdrawal Fee",
    type: "fixed",
    amount: 500,
    category: "savings",
    description: "Fee for early savings withdrawal",
    isActive: false,
    applicableFor: "all",
    chargeTimeType: "on_withdrawal",
    chargePaymentBy: "transfer"
  }
];

interface FeeListTabProps {
  onEdit: (fee: Fee) => void;
  onCreateNew: () => void;
}

export const FeeListTab = ({ onEdit, onCreateNew }: FeeListTabProps) => {
  const { toast } = useToast();

  const handleDelete = async (feeId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Fee Deleted",
        description: "The fee has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Existing Fees</h3>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Fee
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicable For</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingFees.map((fee) => (
              <FeeTableRow 
                key={fee.id} 
                fee={fee} 
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};