import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ValidationFormField } from "../ValidationFormField";

interface KYCInformationStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
}

export const KYCInformationStep = ({ form }: KYCInformationStepProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="client_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Number (Auto-generated)</FormLabel>
              <FormControl>
                <Input placeholder="CLI001" {...field} disabled className="bg-muted" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ValidationFormField
          form={form}
          name="first_name"
          label="First Name"
          placeholder="John"
          required
          guidelines={["Must be at least 2 characters", "Only letters and spaces allowed"]}
        />
        
        <ValidationFormField
          form={form}
          name="middle_name"
          label="Middle Name"
          placeholder="Michael"
        />
        
        <ValidationFormField
          form={form}
          name="last_name"
          label="Last Name"
          placeholder="Doe"
          required
          guidelines={["Must be at least 2 characters", "Only letters and spaces allowed"]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidationFormField
          form={form}
          name="phone"
          label="Phone Number"
          type="phone"
          placeholder="+254700000000"
          required
          guidelines={["Include country code (e.g., +254700000000)", "Must be 10-15 digits"]}
        />
        
        <ValidationFormField
          form={form}
          name="date_of_birth"
          label="Date of Birth"
          type="date"
          required
          guidelines={["Select a valid date", "Date of birth should be in the past"]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidationFormField
          form={form}
          name="place_of_birth"
          label="Place of Birth"
          placeholder="City, Country"
        />
        
        <ValidationFormField
          form={form}
          name="nationality"
          label="Nationality"
          placeholder="Kenyan"
        />
      </div>

      <ValidationFormField
        form={form}
        name="gender"
        label="Gender"
        type="select"
        placeholder="Select gender"
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" }
        ]}
      />

      <ValidationFormField
        form={form}
        name="address"
        label="Residential Address"
        type="textarea"
        placeholder="Enter full residential address"
        rows={3}
      />
    </div>
  );
};