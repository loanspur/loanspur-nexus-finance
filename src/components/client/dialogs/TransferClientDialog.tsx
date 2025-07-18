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
import { ArrowRightLeft } from "lucide-react";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  client_number: string;
}

interface TransferClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export const TransferClientDialog = ({ open, onOpenChange, client }: TransferClientDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Client
          </DialogTitle>
          <DialogDescription>
            Transfer {client.first_name} {client.last_name} to another office or staff member
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle>Client Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Client transfer form will be implemented here</p>
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