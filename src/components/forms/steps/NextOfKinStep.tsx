import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Mail, MapPin, Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

interface NextOfKinStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
}

export const NextOfKinStep = ({ form }: NextOfKinStepProps) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "next_of_kin"
  });

  const addNextOfKin = () => {
    append({
      name: "",
      relationship: "",
      phone: "",
      email: "",
      address: ""
    });
  };

  const removeNextOfKin = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts
          </h3>
        </div>
        <Button type="button" onClick={addNextOfKin} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {fields.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No contacts added</p>
              <Button type="button" onClick={addNextOfKin} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact {index + 1}
              </CardTitle>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeNextOfKin(index)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`next_of_kin.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`next_of_kin.${index}.relationship`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="grandchild">Grandchild</SelectItem>
                        <SelectItem value="uncle_aunt">Uncle/Aunt</SelectItem>
                        <SelectItem value="cousin">Cousin</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                name={`next_of_kin.${index}.phone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+254700000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`next_of_kin.${index}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`next_of_kin.${index}.address`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter contact's address"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}

      {fields.length > 0 && fields.length < 3 && (
        <div className="text-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={addNextOfKin}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Contact
          </Button>
        </div>
      )}
    </div>
  );
};