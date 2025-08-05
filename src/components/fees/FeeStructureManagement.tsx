import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { useFeeStructures, useCreateFeeStructure, useUpdateFeeStructure, useDeleteFeeStructure, FeeStructure } from "@/hooks/useFeeManagement";

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  description: z.string().optional(),
  fee_type: z.string(),
  calculation_type: z.string(),
  amount: z.string().min(1, "Amount/Percentage is required"),
  min_amount: z.string().optional(),
  max_amount: z.string().optional(),
  charge_time_type: z.string(),
  charge_payment_by: z.string(),
  is_active: z.boolean().default(true),
});

type FeeFormData = z.infer<typeof feeSchema>;

export const FeeStructureManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  
  const { data: feeStructures = [], isLoading } = useFeeStructures();
  const createFeeMutation = useCreateFeeStructure();
  const updateFeeMutation = useUpdateFeeStructure();
  const deleteFeeMutation = useDeleteFeeStructure();

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: "",
      description: "",
      fee_type: "loan",
      calculation_type: "fixed",
      amount: "",
      min_amount: "",
      max_amount: "",
      charge_time_type: "upfront",
      charge_payment_by: "regular",
      is_active: true,
    },
  });

  const watchCalculationType = form.watch("calculation_type");

  const onSubmit = async (data: FeeFormData) => {
    const feeData = {
      name: data.name,
      description: data.description || "",
      fee_type: data.fee_type,
      calculation_type: data.calculation_type,
      amount: parseFloat(data.amount),
      min_amount: data.min_amount ? parseFloat(data.min_amount) : undefined,
      max_amount: data.max_amount ? parseFloat(data.max_amount) : undefined,
      charge_time_type: data.charge_time_type,
      charge_payment_by: data.charge_payment_by,
      is_active: data.is_active,
      is_overdue_charge: ['late_payment', 'overdue_payment'].includes(data.charge_time_type),
    };

    if (editingFee) {
      updateFeeMutation.mutate({ id: editingFee.id, data: feeData });
    } else {
      createFeeMutation.mutate(feeData);
    }

    form.reset();
    setEditingFee(null);
    setIsModalOpen(false);
  };

  const handleCreateNew = () => {
    setEditingFee(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    form.reset({
      name: fee.name,
      description: fee.description || "",
      fee_type: fee.fee_type,
      calculation_type: fee.calculation_type,
      amount: fee.amount.toString(),
      min_amount: fee.min_amount?.toString() || "",
      max_amount: fee.max_amount?.toString() || "",
      charge_time_type: (fee as any).charge_time_type || "upfront",
      charge_payment_by: (fee as any).charge_payment_by || "regular",
      is_active: fee.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (feeId: string) => {
    if (confirm("Are you sure you want to delete this fee structure?")) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'loan':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'savings':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'account':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'transaction':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading fee structures...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee & Charge Management</CardTitle>
          <CardDescription>
            Create and manage fee structures for loans, savings, and other services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Fee Structures</h3>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Fee
              </Button>
            </div>

            {feeStructures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No fee structures found</p>
                <p className="text-sm text-muted-foreground">Create your first fee structure to get started</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Charge Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fee.name}</p>
                            {fee.description && (
                              <p className="text-sm text-muted-foreground">{fee.description}</p>
                            )}
                            {fee.is_overdue_charge && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-orange-100 text-orange-800 border-orange-200">
                                🚨 Overdue Charge
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(fee.fee_type)}>
                            {fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {fee.calculation_type === 'percentage' ? (
                              <Percent className="h-4 w-4" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            {fee.calculation_type}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {fee.calculation_type === 'percentage' 
                            ? `${fee.amount}%` 
                            : `KSh ${fee.amount}`
                          }
                          {fee.min_amount && fee.min_amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Min: KSh {fee.min_amount}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {fee.charge_time_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Upfront'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={fee.is_active ? "default" : "secondary"}>
                            {fee.is_active ? "Active" : "Inactive"}
                          </Badge>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee Structure" : "Create New Fee Structure"}
            </DialogTitle>
            <DialogDescription>
              {editingFee 
                ? "Update the fee structure details below." 
                : "Fill in the details to create a new fee structure."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fee_type"
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
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="transaction">Transaction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calculation_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchCalculationType === "percentage" ? "Percentage (%)" : "Amount (KSh)"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder={watchCalculationType === "percentage" ? "e.g., 2.5" : "e.g., 100.00"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount (KSh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Amount (KSh) - Optional</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="1000.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="charge_time_type"
                  render={({ field }) => {
                    const feeType = form.watch("fee_type");
                    const getChargeTimeOptions = () => {
                      if (feeType === "savings") {
                        return [
                          { value: "upfront", label: "Account Opening" },
                          { value: "monthly", label: "Monthly Maintenance" },
                          { value: "quarterly", label: "Quarterly" },
                          { value: "annually", label: "Annual Service" },
                          { value: "on_transaction", label: "Per Transaction" },
                          { value: "on_withdrawal", label: "On Withdrawal" },
                          { value: "on_deposit", label: "On Deposit" },
                        ];
                      } else if (feeType === "loan") {
                        return [
                          { value: "upfront", label: "Application Fee" },
                          { value: "on_disbursement", label: "On Disbursement" },
                          { value: "monthly", label: "Monthly Service" },
                          { value: "on_maturity", label: "On Maturity" },
                          { value: "late_payment", label: "Late Payment" },
                          { value: "early_settlement", label: "Early Settlement" },
                        ];
                      } else {
                        return [
                          { value: "upfront", label: "Upfront" },
                          { value: "monthly", label: "Monthly" },
                          { value: "annually", label: "Annually" },
                          { value: "on_transaction", label: "Per Transaction" },
                        ];
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>Charge Time Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select charge time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getChargeTimeOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="charge_payment_by"
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
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
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
                name="is_active"
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  {createFeeMutation.isPending || updateFeeMutation.isPending
                    ? (editingFee ? "Updating..." : "Creating...") 
                    : (editingFee ? "Update Fee" : "Create Fee")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};