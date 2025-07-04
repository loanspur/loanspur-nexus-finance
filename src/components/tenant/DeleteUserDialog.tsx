import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

export const DeleteUserDialog = ({ open, onOpenChange, user, onSuccess }: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // Instead of deleting, we'll deactivate the user
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been deactivated successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deactivate User
          </DialogTitle>
          <DialogDescription>
            This action will deactivate the user account. The user will no longer be able to access the system.
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">Role: {user.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? "Deactivating..." : "Deactivate User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};