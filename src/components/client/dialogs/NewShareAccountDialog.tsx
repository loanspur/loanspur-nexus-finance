import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share } from "lucide-react";

interface NewShareAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const NewShareAccountDialog = ({ open, onOpenChange, clientId }: NewShareAccountDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            New Share Account
          </DialogTitle>
          <DialogDescription>
            Create a new share account for the client
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle>Share Account Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Share className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Share account creation form will be implemented here</p>
              <Button className="mt-4" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};