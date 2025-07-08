import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  type: z.enum(['fixed', 'percentage']),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  category: z.enum(['loan', 'savings', 'account', 'transaction', 'penalty']),
  chargeTimeType: z.enum(['upfront', 'monthly', 'annually', 'on_maturity', 'on_disbursement']),
  chargePaymentBy: z.enum(['client', 'system', 'automatic', 'manual']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  applicableFor: z.enum(['all', 'new_clients', 'existing_clients']),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FeeManagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeeManagementForm = ({ open, onOpenChange }: FeeManagementFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");
  const { toast } = useToast();

  // Mock existing fees
  const existingFees = [
    {
      id: "fee_001",
      name: "Loan Processing Fee",
      type: "percentage",
      amount: 2.5,
      category: "loan",
      description: "Fee charged for processing new loan applications",
      isActive: true,
      applicableFor: "all"
    },
    {
      id: "fee_002",
      name: "Account Maintenance Fee",
      type: "fixed",
      amount: 100,
      category: "account",
      description: "Monthly account maintenance fee",
      isActive: true,
      applicableFor: "all"
    },
    {
      id: "fee_003",
      name: "Late Payment Penalty",
      type: "percentage",
      amount: 1.0,
      category: "penalty",
      description: "Penalty for late loan repayments",
      isActive: true,
      applicableFor: "all"
    },
    {
      id: "fee_004",
      name: "Early Withdrawal Fee",
      type: "fixed",
      amount: 500,
      category: "savings",
      description: "Fee for early savings withdrawal",
      isActive: false,
      applicableFor: "all"
    }
  ];

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: "",
      type: "fixed",
      amount: "",
      category: "loan",
      chargeTimeType: "upfront",
      chargePaymentBy: "client",
      description: "",
      isActive: true,
      applicableFor: "all",
    },
  });

  const onSubmit = async (data: FeeFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: editingFee ? "Fee Updated" : "Fee Created",
        description: editingFee 
          ? "The fee has been successfully updated." 
          : "The new fee has been successfully created.",
      });
      
      form.reset();
      setEditingFee(null);
      setActiveTab("list");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save fee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fee: any) => {
    setEditingFee(fee);
    form.reset({
      name: fee.name,
      type: fee.type,
      amount: fee.amount.toString(),
      category: fee.category,
      chargeTimeType: fee.chargeTimeType || "upfront",
      chargePaymentBy: fee.chargePaymentBy || "client",
      description: fee.description,
      isActive: fee.isActive,
      applicableFor: fee.applicableFor,
    });
    setActiveTab("form");
  };

  const handleDelete = async (feeId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Fee Deleted",
        description: "The fee has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'loan':
        return 'bg-blue-100 text-blue-800';
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'account':
        return 'bg-purple-100 text-purple-800';
      case 'transaction':
        return 'bg-orange-100 text-orange-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatApplicableFor = (applicableFor: string) => {
    return applicableFor.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Existing Fees</h3>
              <Button onClick={() => {
                setEditingFee(null);
                form.reset();
                setActiveTab("form");
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Fee
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applicable For</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fee.name}</p>
                          {fee.description && (
                            <p className="text-sm text-muted-foreground">{fee.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(fee.category)}>
                          {formatCategory(fee.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {fee.type === 'percentage' ? (
                            <Percent className="h-4 w-4" />
                          ) : (
                            <DollarSign className="h-4 w-4" />
                          )}
                          {formatType(fee.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fee.type === 'percentage' ? `${fee.amount}%` : `KSh ${fee.amount}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.isActive ? "default" : "secondary"}>
                          {fee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatApplicableFor(fee.applicableFor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(fee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(fee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Loan Processing Fee" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="transaction">Transaction</SelectItem>
                            <SelectItem value="penalty">Penalty</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount {form.watch("type") === "percentage" ? "(%)" : "(KSh)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch("type") === "percentage" ? "2.5" : "1000"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                 <FormField
                   control={form.control}
                   name="applicableFor"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Applicable For</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select applicability" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="all">All Clients</SelectItem>
                           <SelectItem value="new_clients">New Clients Only</SelectItem>
                           <SelectItem value="existing_clients">Existing Clients Only</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="chargeTimeType"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Charge Time Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select charge time" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             <SelectItem value="upfront">Upfront</SelectItem>
                             <SelectItem value="monthly">Monthly</SelectItem>
                             <SelectItem value="annually">Annually</SelectItem>
                             <SelectItem value="on_maturity">On Maturity</SelectItem>
                             <SelectItem value="on_disbursement">On Disbursement</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="chargePaymentBy"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Charge Payment By</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select payment method" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             <SelectItem value="client">Client</SelectItem>
                             <SelectItem value="system">System</SelectItem>
                             <SelectItem value="automatic">Automatic</SelectItem>
                             <SelectItem value="manual">Manual</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe when this fee applies and any conditions..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this fee to be automatically applied
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (editingFee ? "Updating..." : "Creating...") 
                      : (editingFee ? "Update Fee" : "Create Fee")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Fee Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KSh 145,000</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {existingFees.filter(fee => fee.isActive).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {existingFees.length} total fees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Fee Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KSh 450</div>
                  <p className="text-xs text-muted-foreground">Per transaction</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fee Performance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Loan Fees</span>
                    <span className="font-semibold">KSh 85,000 (58.6%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Account Fees</span>
                    <span className="font-semibold">KSh 35,000 (24.1%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transaction Fees</span>
                    <span className="font-semibold">KSh 15,000 (10.3%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Penalty Fees</span>
                    <span className="font-semibold">KSh 10,000 (6.9%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};