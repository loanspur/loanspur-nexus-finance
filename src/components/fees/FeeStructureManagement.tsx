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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { useFeeStructures, useCreateFeeStructure, useUpdateFeeStructure, useDeleteFeeStructure, FeeStructure } from "@/hooks/useFeeManagement";

const feeSchema = z.object({
  fee_name: z.string().min(1, "Fee name is required"),
  fee_code: z.string().min(1, "Fee code is required"),
  description: z.string().optional(),
  fee_type: z.enum(['loan', 'savings', 'transaction', 'account']),
  calculation_method: z.enum(['fixed', 'percentage', 'tiered']),
  fixed_amount: z.string().optional(),
  percentage_rate: z.string().optional(),
  minimum_fee: z.string().optional(),
  maximum_fee: z.string().optional(),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'annually']),
  charge_time_type: z.enum(['upfront', 'monthly', 'annually', 'on_maturity', 'on_disbursement']),
  charge_payment_by: z.enum(['client', 'system', 'automatic', 'manual']),
  is_active: z.boolean().default(true),
});

type FeeFormData = z.infer<typeof feeSchema>;

export const FeeStructureManagement = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  
  const { data: feeStructures = [], isLoading } = useFeeStructures();
  const createFeeMutation = useCreateFeeStructure();
  const updateFeeMutation = useUpdateFeeStructure();
  const deleteFeeMutation = useDeleteFeeStructure();

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      fee_name: "",
      fee_code: "",
      description: "",
      fee_type: "loan",
      calculation_method: "fixed",
      fixed_amount: "",
      percentage_rate: "",
      minimum_fee: "",
      maximum_fee: "",
      frequency: "one_time",
      charge_time_type: "upfront",
      charge_payment_by: "client",
      is_active: true,
    },
  });

  const watchCalculationMethod = form.watch("calculation_method");

  const onSubmit = async (data: FeeFormData) => {
    const feeData = {
      fee_name: data.fee_name,
      fee_code: data.fee_code,
      description: data.description || "",
      fee_type: data.fee_type,
      calculation_method: data.calculation_method,
      fixed_amount: data.fixed_amount ? parseFloat(data.fixed_amount) : 0,
      percentage_rate: data.percentage_rate ? parseFloat(data.percentage_rate) : 0,
      minimum_fee: data.minimum_fee ? parseFloat(data.minimum_fee) : 0,
      maximum_fee: data.maximum_fee ? parseFloat(data.maximum_fee) : undefined,
      frequency: data.frequency,
      is_active: data.is_active,
    };

    if (editingFee) {
      updateFeeMutation.mutate({ id: editingFee.id, data: feeData });
    } else {
      createFeeMutation.mutate(feeData);
    }

    form.reset();
    setEditingFee(null);
    setActiveTab("list");
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    form.reset({
      fee_name: fee.fee_name,
      fee_code: fee.fee_code,
      description: fee.description || "",
      fee_type: fee.fee_type,
      calculation_method: fee.calculation_method,
      fixed_amount: fee.fixed_amount.toString(),
      percentage_rate: fee.percentage_rate.toString(),
      minimum_fee: fee.minimum_fee.toString(),
      maximum_fee: fee.maximum_fee?.toString() || "",
      frequency: fee.frequency,
      charge_time_type: (fee as any).charge_time_type || "upfront",
      charge_payment_by: (fee as any).charge_payment_by || "client",
      is_active: fee.is_active,
    });
    setActiveTab("form");
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Fee Structures</TabsTrigger>
              <TabsTrigger value="form">
                {editingFee ? "Edit Fee" : "Create New Fee"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">All Fee Structures</h3>
                <Button onClick={() => {
                  setEditingFee(null);
                  form.reset();
                  setActiveTab("form");
                }}>
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
                        <TableHead>Frequency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructures.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{fee.fee_name}</p>
                              <p className="text-xs text-muted-foreground">{fee.fee_code}</p>
                              {fee.description && (
                                <p className="text-sm text-muted-foreground">{fee.description}</p>
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
                              {fee.calculation_method === 'percentage' ? (
                                <Percent className="h-4 w-4" />
                              ) : (
                                <DollarSign className="h-4 w-4" />
                              )}
                              {fee.calculation_method}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {fee.calculation_method === 'percentage' 
                              ? `${fee.percentage_rate}%` 
                              : `$${fee.fixed_amount}`
                            }
                            {fee.minimum_fee > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Min: ${fee.minimum_fee}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {fee.frequency.replace('_', ' ')}
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
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fee_name"
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
                      name="fee_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., LPF001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                      name="calculation_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calculation Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="tiered">Tiered</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {watchCalculationMethod === 'fixed' && (
                      <FormField
                        control={form.control}
                        name="fixed_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fixed Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="100.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchCalculationMethod === 'percentage' && (
                      <FormField
                        control={form.control}
                        name="percentage_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentage Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="2.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="one_time">One Time</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
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
                      name="minimum_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Fee ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maximum_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Fee ($) - Optional</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="1000.00" {...field} />
                          </FormControl>
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="charge_time_type"
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
                    <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};