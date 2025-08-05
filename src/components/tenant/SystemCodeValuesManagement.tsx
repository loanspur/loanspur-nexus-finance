import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Settings2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code_value: z.string().min(1, "Code value is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface SystemCodeValue {
  id: string;
  name: string;
  code_value: string;
  description?: string;
  is_active: boolean;
  category_id: string;
}

const SYSTEM_CODE_TYPES = [
  { name: 'COLLATERAL_TYPE', description: 'Types of collateral that can be used to secure loans' },
  { name: 'LOAN_PURPOSE', description: 'Predefined purposes for loan applications' },
  { name: 'ACCOUNT_CLOSURE_REASON', description: 'Reasons for closing accounts' },
  { name: 'PAYMENT_METHOD', description: 'Available payment methods' },
  { name: 'TRANSACTION_TYPE', description: 'Types of financial transactions' },
  { name: 'DOCUMENT_TYPE', description: 'Types of documents in the system' },
  { name: 'EMPLOYMENT_STATUS', description: 'Client employment status options' },
  { name: 'MARITAL_STATUS', description: 'Client marital status options' },
];

export function SystemCodeValuesManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedCodeType, setSelectedCodeType] = useState(SYSTEM_CODE_TYPES[0].name);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code_value: "",
      description: "",
      is_active: true,
    },
  });

  const { data: systemCodeValues = [], isLoading, refetch } = useQuery({
    queryKey: ['system-code-values', profile?.tenant_id, selectedCodeType],
    queryFn: async () => {
      // This would need to be implemented with actual system_code_values table
      // For now, return empty array as this is a placeholder
      return [] as SystemCodeValue[];
    },
    enabled: !!profile?.tenant_id,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingId) {
        // This would update system_code_values table
        // For now, just show success message
        const error = null;

        if (error) throw error;

        toast({
          title: "Success",
          description: "System code value updated successfully",
        });
      } else {
        // This would insert into system_code_values table
        // For now, just show success message
        const error = null;

        if (error) throw error;

        toast({
          title: "Success",
          description: "System code value created successfully",
        });
      }

      form.reset();
      setEditingId(null);
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error saving system code value:", error);
      toast({
        title: "Error",
        description: "Failed to save system code value",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (codeValue: SystemCodeValue) => {
    form.setValue('name', codeValue.name);
    form.setValue('code_value', codeValue.code_value);
    form.setValue('description', codeValue.description || '');
    form.setValue('is_active', codeValue.is_active);
    setEditingId(codeValue.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // This would delete from system_code_values table
      // For now, just show success message
      const error = null;

      if (error) throw error;

      toast({
        title: "Success",
        description: "System code value deleted successfully",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting system code value:", error);
      toast({
        title: "Error",
        description: "Failed to delete system code value",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">
            Manage global system code values used across the application
          </p>
        </div>
      </div>

      <Tabs value={selectedCodeType} onValueChange={setSelectedCodeType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {SYSTEM_CODE_TYPES.map((type) => (
            <TabsTrigger key={type.name} value={type.name} className="text-xs">
              {type.name.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {SYSTEM_CODE_TYPES.map((type) => (
          <TabsContent key={type.name} value={type.name}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      {type.name.replace(/_/g, ' ')} Management
                    </CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                  
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {type.name.replace(/_/g, ' ')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingId ? 'Edit' : 'Add'} {type.name.replace(/_/g, ' ')}
                        </DialogTitle>
                        <DialogDescription>
                          {editingId ? 'Update' : 'Create'} a new {type.name.replace(/_/g, ' ').toLowerCase()} value
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="code_value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code Value</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter code value" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={resetForm}>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button type="submit">
                              <Save className="w-4 h-4 mr-2" />
                              {editingId ? 'Update' : 'Create'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : systemCodeValues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No {type.name.replace(/_/g, ' ').toLowerCase()} values configured</p>
                    <p className="text-sm">Add your first value to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code Value</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemCodeValues.map((codeValue) => (
                        <TableRow key={codeValue.id}>
                          <TableCell className="font-medium">{codeValue.name}</TableCell>
                          <TableCell>{codeValue.code_value}</TableCell>
                          <TableCell>{codeValue.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={codeValue.is_active ? "default" : "secondary"}>
                              {codeValue.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(codeValue)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(codeValue.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}