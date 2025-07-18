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
import { PiggyBank } from "lucide-react";

interface NewSavingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const NewSavingsDialog = ({ open, onOpenChange, clientId }: NewSavingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            New Savings Account
          </DialogTitle>
          <DialogDescription>
            Create a new savings account for the client
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle>Savings Account Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Savings account creation form will be implemented here</p>
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