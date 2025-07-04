import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Building, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const transferClientSchema = z.object({
  new_branch_id: z.string().min(1, "Please select a branch"),
  new_loan_officer_id: z.string().min(1, "Please select a loan officer"),
  transfer_reason: z.string().min(1, "Transfer reason is required"),
  transfer_notes: z.string().optional(),
});

type TransferClientData = z.infer<typeof transferClientSchema>;

interface TransferClientDialogProps {
  clientId: string;
  clientName: string;
  currentBranch: string;
  currentLoanOfficer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock data - replace with actual API calls
const branches = [
  { id: "main", name: "Main Branch", location: "Nairobi CBD" },
  { id: "westlands", name: "Westlands Branch", location: "Westlands, Nairobi" },
  { id: "karen", name: "Karen Branch", location: "Karen, Nairobi" },
  { id: "mombasa", name: "Mombasa Branch", location: "Mombasa" },
  { id: "nakuru", name: "Nakuru Branch", location: "Nakuru" },
];

const loanOfficers = [
  { id: "jane", name: "Jane Wanjiku", branch: "main", title: "Senior Loan Officer" },
  { id: "peter", name: "Peter Kiprotich", branch: "main", title: "Loan Officer" },
  { id: "mary", name: "Mary Achieng", branch: "westlands", title: "Senior Loan Officer" },
  { id: "john", name: "John Mwangi", branch: "westlands", title: "Loan Officer" },
  { id: "grace", name: "Grace Njeri", branch: "karen", title: "Branch Manager" },
  { id: "david", name: "David Ochieng", branch: "mombasa", title: "Senior Loan Officer" },
  { id: "sarah", name: "Sarah Wanjiru", branch: "nakuru", title: "Loan Officer" },
];

export const TransferClientDialog = ({ 
  clientId, 
  clientName, 
  currentBranch,
  currentLoanOfficer,
  open, 
  onOpenChange,
  onSuccess 
}: TransferClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const { toast } = useToast();

  const form = useForm<TransferClientData>({
    resolver: zodResolver(transferClientSchema),
    defaultValues: {
      new_branch_id: "",
      new_loan_officer_id: "",
      transfer_reason: "",
      transfer_notes: "",
    },
  });

  // Filter loan officers based on selected branch
  const availableLoanOfficers = selectedBranch 
    ? loanOfficers.filter(officer => officer.branch === selectedBranch)
    : [];

  const onSubmit = async (data: TransferClientData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to transfer the client
      const transferData = {
        client_id: clientId,
        new_branch_id: data.new_branch_id,
        new_loan_officer_id: data.new_loan_officer_id,
        transfer_reason: data.transfer_reason,
        transfer_notes: data.transfer_notes,
        transfer_date: new Date().toISOString(),
        transferred_by: "current_user_id", // Replace with actual user ID
      };

      console.log('Transferring client:', transferData);

      const newBranch = branches.find(b => b.id === data.new_branch_id);
      const newOfficer = loanOfficers.find(o => o.id === data.new_loan_officer_id);

      toast({
        title: "Transfer Successful",
        description: `${clientName} has been transferred to ${newBranch?.name} under ${newOfficer?.name}`,
      });

      form.reset();
      setSelectedBranch("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error transferring client:", error);
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transfer Client
          </DialogTitle>
          <DialogDescription>
            Transfer {clientName} to a different branch and assign a new loan officer
          </DialogDescription>
        </DialogHeader>

        {/* Current Assignment */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Assignment</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Branch</div>
                  <div className="text-sm text-muted-foreground">{currentBranch}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Loan Officer</div>
                  <div className="text-sm text-muted-foreground">{currentLoanOfficer}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="new_branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Branch *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedBranch(value);
                        // Reset loan officer when branch changes
                        form.setValue("new_loan_officer_id", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div>
                              <div className="font-medium">{branch.name}</div>
                              <div className="text-xs text-muted-foreground">{branch.location}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new_loan_officer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Loan Officer *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedBranch}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedBranch ? "Select loan officer" : "Select branch first"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLoanOfficers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            <div>
                              <div className="font-medium">{officer.name}</div>
                              <div className="text-xs text-muted-foreground">{officer.title}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transfer_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Reason *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transfer reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="client_request">Client Request</SelectItem>
                      <SelectItem value="relocation">Client Relocation</SelectItem>
                      <SelectItem value="officer_change">Loan Officer Change</SelectItem>
                      <SelectItem value="branch_optimization">Branch Optimization</SelectItem>
                      <SelectItem value="workload_balancing">Workload Balancing</SelectItem>
                      <SelectItem value="specialization">Product Specialization</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transfer_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this transfer..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transfer Preview */}
            {selectedBranch && form.watch("new_loan_officer_id") && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-800">Transfer Preview</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currentBranch}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-green-700">
                        {branches.find(b => b.id === selectedBranch)?.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Transfer Record
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currentLoanOfficer}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-green-700">
                        {loanOfficers.find(o => o.id === form.watch("new_loan_officer_id"))?.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Transferring..." : "Transfer Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};