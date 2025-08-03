import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyProfileSection } from "@/components/profile/CompanyProfileSection";

interface BusinessSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BusinessSettingsDialog = ({ open, onOpenChange }: BusinessSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Business Settings</DialogTitle>
          <DialogDescription>
            Configure your organization details and business settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <CompanyProfileSection />
        </div>
      </DialogContent>
    </Dialog>
  );
};