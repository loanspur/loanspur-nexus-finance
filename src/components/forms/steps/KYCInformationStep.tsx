import { useEffect } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ValidationFormField } from "../ValidationFormField";
import { useUserAccessibleOffices, useOfficeStaff } from "@/hooks/useOfficeManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KYCInformationStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
}

export const KYCInformationStep = ({ form }: KYCInformationStepProps) => {
  const { data: offices = [] } = useUserAccessibleOffices();
  const selectedOfficeId = form.watch("office_id");
  const { data: officeStaff = [] } = useOfficeStaff(selectedOfficeId);
  
  // Since useUserAccessibleOffices already filters out head offices and inactive offices,
  // we can use the offices directly
  const activeOffices = offices;
  const loanOfficers = (selectedOfficeId ? officeStaff : []).filter(staff => 
    staff && 
    staff.staff && 
    staff.role_in_office === 'loan_officer' && 
    staff.is_active
  );

  // Selected office and opening date constraints
  const selectedOffice = activeOffices.find((o: any) => o.id === selectedOfficeId);
  const officeOpeningDateRaw = selectedOffice?.opening_date as string | undefined;
  const officeOpeningDateStr = officeOpeningDateRaw
    ? new Date(new Date(officeOpeningDateRaw).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
    : undefined;
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    if (officeOpeningDateStr) {
      form.setValue('office_opening_date', officeOpeningDateStr);
    } else {
      form.setValue('office_opening_date', '');
    }
  }, [officeOpeningDateStr, form]);

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
        />
        
        <ValidationFormField
          form={form}
          name="date_of_birth"
          label="Date of Birth"
          type="date"
          required
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

      <div className="grid grid-cols-2 gap-4">
        <ValidationFormField
          form={form}
          name="national_id"
          label="National ID Number"
          placeholder="12345678"
          required
          type="text"
          maxLength={8}
        />
        
        <FormField
          control={form.control}
          name="account_opening_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Opening Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="Select date"
                  max={todayStr}
                  {...(officeOpeningDateStr ? { min: officeOpeningDateStr } : {})}
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
          name="office_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Office/Branch *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select office/branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.office_name} ({office.office_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loan_officer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Officer</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!selectedOfficeId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan officer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loanOfficers.map((staff) => (
                    <SelectItem key={staff.staff_id} value={staff.staff_id}>
                      {`${staff.staff?.first_name ?? ''} ${staff.staff?.last_name ?? ''}`.trim() || staff.staff?.email || 'Unnamed staff'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
