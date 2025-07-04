import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, FileText, Car } from "lucide-react";

interface UniqueIdentifiersStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
}

export const UniqueIdentifiersStep = ({ form }: UniqueIdentifiersStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            National ID
          </CardTitle>
          <CardDescription>
            Primary government-issued identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="national_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID Number</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Passport
          </CardTitle>
          <CardDescription>
            International travel document (if available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="passport_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input placeholder="A1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Driving License
          </CardTitle>
          <CardDescription>
            Valid driving license (if available)
          </CardDescription>
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
    </div>
  );
};