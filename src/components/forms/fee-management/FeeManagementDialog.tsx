import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeListTab } from "./FeeListTab";
import { FeeFormTab } from "./FeeFormTab";
import { FeeAnalyticsTab } from "./FeeAnalyticsTab";
import { Fee } from "./types";

interface FeeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeeManagementDialog = ({ open, onOpenChange }: FeeManagementDialogProps) => {
  const [activeTab, setActiveTab] = useState("list");
  const [editingFee, setEditingFee] = useState<Fee | null>(null);

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee);
    setActiveTab("form");
  };

  const handleCreateNew = () => {
    setEditingFee(null);
    setActiveTab("form");
  };

  const handleFormComplete = () => {
    setEditingFee(null);
    setActiveTab("list");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Fee Management</DialogTitle>
          <DialogDescription>
            Manage fee structures and pricing for various banking services
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Fee List</TabsTrigger>
            <TabsTrigger value="form">
              {editingFee ? "Edit Fee" : "Create Fee"}
            </TabsTrigger>
            <TabsTrigger value="analytics">Fee Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <FeeListTab onEdit={handleEdit} onCreateNew={handleCreateNew} />
          </TabsContent>

          <TabsContent value="form">
            <FeeFormTab 
              editingFee={editingFee} 
              onComplete={handleFormComplete}
              onCancel={() => setActiveTab("list")}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <FeeAnalyticsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};