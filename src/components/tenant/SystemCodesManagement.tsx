import { useState } from "react";
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useSystemCodeCategories,
  useSystemCodeValues,
  useCreateSystemCodeCategory,
  useUpdateSystemCodeCategory,
  useCreateSystemCodeValue,
  useUpdateSystemCodeValue,
  useDeleteSystemCodeValue,
} from "@/hooks/useSystemCodes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code_name: z.string().min(1, "Code name is required").regex(/^[A-Z_]+$/, "Code name must be uppercase letters and underscores only"),
});

const valueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code_value: z.string().min(1, "Code value is required").regex(/^[A-Z_]+$/, "Code value must be uppercase letters and underscores only"),
  position: z.number().min(0).optional(),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type ValueFormData = z.infer<typeof valueSchema>;

export const SystemCodesManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showValueDialog, setShowValueDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useSystemCodeCategories();
  const { data: values = [], isLoading: valuesLoading } = useSystemCodeValues(selectedCategory || undefined);

  const createCategory = useCreateSystemCodeCategory();
  const updateCategory = useUpdateSystemCodeCategory();
  const createValue = useCreateSystemCodeValue();
  const updateValue = useUpdateSystemCodeValue();
  const deleteValue = useDeleteSystemCodeValue();

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      code_name: "",
    },
  });

  const valueForm = useForm<ValueFormData>({
    resolver: zodResolver(valueSchema),
    defaultValues: {
      name: "",
      description: "",
      code_value: "",
      position: 0,
      is_active: true,
    },
  });

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleCreateCategory = async (data: CategoryFormData) => {
    await createCategory.mutateAsync({
      name: data.name,
      description: data.description,
      code_name: data.code_name,
    });
    setShowCategoryDialog(false);
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      description: "",
      code_name: "",
    });
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      name: data.name,
      description: data.description,
      is_active: editingCategory.is_active,
    });
    setShowCategoryDialog(false);
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      description: "",
      code_name: "",
    });
  };

  const handleCreateValue = async (data: ValueFormData) => {
    if (!selectedCategory) return;
    await createValue.mutateAsync({
      category_id: selectedCategory,
      name: data.name,
      description: data.description,
      code_value: data.code_value,
      position: data.position,
      is_active: data.is_active,
    });
    setShowValueDialog(false);
    setEditingValue(null);
    valueForm.reset({
      name: "",
      description: "",
      code_value: "",
      position: 0,
      is_active: true,
    });
  };

  const handleUpdateValue = async (data: ValueFormData) => {
    if (!editingValue) return;
    await updateValue.mutateAsync({
      id: editingValue.id,
      name: data.name,
      description: data.description,
      code_value: data.code_value,
      position: data.position,
      is_active: data.is_active,
    });
    setShowValueDialog(false);
    setEditingValue(null);
    valueForm.reset({
      name: "",
      description: "",
      code_value: "",
      position: 0,
      is_active: true,
    });
  };

  const handleDeleteValue = async () => {
    if (!deleteValueId) return;
    await deleteValue.mutateAsync(deleteValueId);
    setDeleteValueId(null);
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.setValue("name", category.name);
    categoryForm.setValue("description", category.description || "");
    categoryForm.setValue("code_name", category.code_name);
    setShowCategoryDialog(true);
  };

  const openEditValue = (value: any) => {
    setEditingValue(value);
    valueForm.setValue("name", value.name);
    valueForm.setValue("description", value.description || "");
    valueForm.setValue("code_value", value.code_value);
    valueForm.setValue("position", value.position || 0);
    valueForm.setValue("is_active", value.is_active);
    setShowValueDialog(true);
  };

  const openCreateValue = () => {
    setEditingValue(null);
    valueForm.reset({
      name: "",
      description: "",
      code_value: "",
      position: 0,
      is_active: true,
    });
    setShowValueDialog(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      description: "",
      code_name: "",
    });
    setShowCategoryDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Codes</h2>
          <p className="text-muted-foreground">
            Manage configurable dropdown values and system parameters
          </p>
        </div>
        <Button onClick={openCreateCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>Code Categories</CardTitle>
            <CardDescription>
              System code categories define the types of configurable values
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="text-center py-4">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory === category.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.name}</h4>
                          {category.is_system_defined && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                          {!category.is_active && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {category.code_name}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCategory(category);
                        }}
                        disabled={category.is_system_defined}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Values List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedCategoryData ? `${selectedCategoryData.name} Values` : "Select a Category"}
                </CardTitle>
                <CardDescription>
                  {selectedCategoryData
                    ? "Manage values for the selected category"
                    : "Select a category to view and manage its values"}
                </CardDescription>
              </div>
              {selectedCategory && (
                <Button size="sm" onClick={openCreateValue}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a category from the left to view its values</p>
              </div>
            ) : valuesLoading ? (
              <div className="text-center py-4">Loading values...</div>
            ) : values.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No values configured for this category</p>
                <Button className="mt-4" size="sm" onClick={openCreateValue}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Value
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((value) => (
                    <TableRow key={value.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{value.name}</div>
                          {value.description && (
                            <div className="text-sm text-muted-foreground">
                              {value.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {value.code_value}
                        </code>
                      </TableCell>
                      <TableCell>{value.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {value.is_active ? (
                            <Badge variant="default" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {value.is_system_defined && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditValue(value)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!value.is_system_defined && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteValueId(value.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details"
                : "Create a new system code category"}
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(
                editingCategory ? handleUpdateCategory : handleCreateCategory
              )}
              className="space-y-4"
            >
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Loan Purposes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="code_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., LOAN_PURPOSE"
                        {...field}
                        disabled={editingCategory?.is_system_defined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this category..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setEditingCategory(null);
                    categoryForm.reset({
                      name: "",
                      description: "",
                      code_name: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Value Dialog */}
      <Dialog open={showValueDialog} onOpenChange={setShowValueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue ? "Edit Value" : "Create Value"}
            </DialogTitle>
            <DialogDescription>
              {editingValue
                ? "Update the value details"
                : `Create a new value for ${selectedCategoryData?.name}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...valueForm}>
            <form
              onSubmit={valueForm.handleSubmit(
                editingValue ? handleUpdateValue : handleCreateValue
              )}
              className="space-y-4"
            >
              <FormField
                control={valueForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Business Expansion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="code_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., BUSINESS_EXPANSION"
                        {...field}
                        disabled={editingValue?.is_system_defined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this value..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={valueForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={valueForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
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
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowValueDialog(false);
                    setEditingValue(null);
                    valueForm.reset({
                      name: "",
                      description: "",
                      code_value: "",
                      position: 0,
                      is_active: true,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingValue ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteValueId} onOpenChange={() => setDeleteValueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System Code Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this system code value? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteValue}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};