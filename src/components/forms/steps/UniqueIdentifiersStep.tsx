import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, FileText, Car } from "lucide-react";

interface UniqueIdentifiersStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
}

export const UniqueIdentifiersStep = ({ form }: UniqueIdentifiersStepProps) => {
  const selectedType = form.watch('selected_identifier_type');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Identifier Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="selected_identifier_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifier Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an identifier type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="passport_number">Passport</SelectItem>
                    <SelectItem value="driving_license_number">Driving License</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {selectedType === 'national_id' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              National ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12345678" 
                      maxLength={8}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}

      {selectedType === 'passport_number' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Passport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="passport_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passport Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="A1234567" 
                      maxLength={12}
                      style={{ textTransform: 'uppercase' }}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}

      {selectedType === 'driving_license_number' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Driving License
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="driving_license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driving License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="DL123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};