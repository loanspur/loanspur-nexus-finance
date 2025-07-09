import { FeeManagementDialog } from "./fee-management/FeeManagementDialog";

interface FeeManagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeeManagementForm = ({ open, onOpenChange }: FeeManagementFormProps) => {
  return <FeeManagementDialog open={open} onOpenChange={onOpenChange} />;
};