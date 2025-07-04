import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MPesaIntegrationManagement from "@/components/tenant/MPesaIntegrationManagement";

interface TenantMPesaDialogProps {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TenantMPesaDialog = ({ tenantId, open, onOpenChange }: TenantMPesaDialogProps) => {
  if (!tenantId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>M-Pesa Integration Management</DialogTitle>
        </DialogHeader>
        <MPesaIntegrationManagement tenantId={tenantId} />
      </DialogContent>
    </Dialog>
  );
};