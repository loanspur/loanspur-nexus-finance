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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Building, ArrowRight, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const updateLoanOfficerSchema = z.object({
  new_loan_officer_id: z.string().min(1, "Please select a loan officer"),
  change_reason: z.string().min(1, "Please select a reason for the change"),
  notes: z.string().optional(),
});

type UpdateLoanOfficerData = z.infer<typeof updateLoanOfficerSchema>;

interface UpdateLoanOfficerDialogProps {
  clientId: string;
  clientName: string;
  currentLoanOfficer: {
    id: string;
    name: string;
    title: string;
    branch: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock data - replace with actual API calls
const loanOfficers = [
  { 
    id: "jane", 
    name: "Jane Wanjiku", 
    branch: "Main Branch", 
    title: "Senior Loan Officer",
    email: "jane.wanjiku@company.com",
    phone: "+254 712 345 678",
    specialization: "SME Loans",
    clientCount: 45
  },
  { 
    id: "peter", 
    name: "Peter Kiprotich", 
    branch: "Main Branch", 
    title: "Loan Officer",
    email: "peter.kiprotich@company.com",
    phone: "+254 723 456 789",
    specialization: "Personal Loans",
    clientCount: 32
  },
  { 
    id: "mary", 
    name: "Mary Achieng", 
    branch: "Westlands Branch", 
    title: "Senior Loan Officer",
    email: "mary.achieng@company.com",
    phone: "+254 734 567 890",
    specialization: "Agricultural Loans",
    clientCount: 38
  },
  { 
    id: "john", 
    name: "John Mwangi", 
    branch: "Westlands Branch", 
    title: "Loan Officer",
    email: "john.mwangi@company.com",
    phone: "+254 745 678 901",
    specialization: "Micro Loans",
    clientCount: 41
  },
  { 
    id: "grace", 
    name: "Grace Njeri", 
    branch: "Karen Branch", 
    title: "Branch Manager",
    email: "grace.njeri@company.com",
    phone: "+254 756 789 012",
    specialization: "Premium Banking",
    clientCount: 28
  },
];

export const UpdateLoanOfficerDialog = ({ 
  clientId, 
  clientName, 
  currentLoanOfficer,
  open, 
  onOpenChange,
  onSuccess 
}: UpdateLoanOfficerDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const { toast } = useToast();

  const form = useForm<UpdateLoanOfficerData>({
    resolver: zodResolver(updateLoanOfficerSchema),
    defaultValues: {
      new_loan_officer_id: "",
      change_reason: "",
      notes: "",
    },
  });

  const selectedOfficer = loanOfficers.find(officer => officer.id === selectedOfficerId);

  const onSubmit = async (data: UpdateLoanOfficerData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to update the loan officer
      const updateData = {
        client_id: clientId,
        previous_loan_officer_id: currentLoanOfficer.id,
        new_loan_officer_id: data.new_loan_officer_id,
        change_reason: data.change_reason,
        notes: data.notes,
        change_date: new Date().toISOString(),
        changed_by: "current_user_id", // Replace with actual user ID
      };

      console.log('Updating loan officer:', updateData);

      const newOfficer = loanOfficers.find(o => o.id === data.new_loan_officer_id);

      toast({
        title: "Loan Officer Updated",
        description: `${clientName}'s loan officer has been changed to ${newOfficer?.name}`,
      });

      form.reset();
      setSelectedOfficerId("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating loan officer:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update loan officer. Please try again.",
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
            <User className="h-5 w-5 text-blue-600" />
            Update Loan Officer
          </DialogTitle>
          <DialogDescription>
            Change the loan officer assigned to {clientName}
          </DialogDescription>
        </DialogHeader>

        {/* Current Loan Officer */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Loan Officer</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback>
                  {currentLoanOfficer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{currentLoanOfficer.name}</div>
                <div className="text-sm text-muted-foreground">{currentLoanOfficer.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{currentLoanOfficer.branch}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_loan_officer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Loan Officer *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedOfficerId(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new loan officer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loanOfficers
                        .filter(officer => officer.id !== currentLoanOfficer.id)
                        .map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            <div className="flex items-center gap-3 py-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-xs">
                                  {officer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{officer.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {officer.title} • {officer.branch}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {officer.specialization} • {officer.clientCount} clients
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Officer Details */}
            {selectedOfficer && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-800">New Loan Officer Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {selectedOfficer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-green-800">{selectedOfficer.name}</div>
                      <div className="text-sm text-green-700">{selectedOfficer.title}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-green-600">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {selectedOfficer.branch}
                        </div>
                        <div>Specializes in {selectedOfficer.specialization}</div>
                        <div>{selectedOfficer.clientCount} clients</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="change_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason for change" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="workload_balancing">Workload Balancing</SelectItem>
                      <SelectItem value="specialization_match">Better Specialization Match</SelectItem>
                      <SelectItem value="client_request">Client Request</SelectItem>
                      <SelectItem value="officer_unavailable">Current Officer Unavailable</SelectItem>
                      <SelectItem value="performance_improvement">Performance Improvement</SelectItem>
                      <SelectItem value="geographic_proximity">Geographic Proximity</SelectItem>
                      <SelectItem value="language_preference">Language Preference</SelectItem>
                      <SelectItem value="relationship_issues">Relationship Issues</SelectItem>
                      <SelectItem value="promotion_transfer">Officer Promotion/Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this change..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Change Preview */}
            {selectedOfficer && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Change Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currentLoanOfficer.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-blue-700">{selectedOfficer.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Effective Immediately
                    </Badge>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    This change will be recorded in the client's history and both officers will be notified.
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
                {isSubmitting ? "Updating..." : "Update Loan Officer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};