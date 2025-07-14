import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface LoanPurposeInputProps {
  control: Control<any>;
}

export const LoanPurposeInput = ({ control }: LoanPurposeInputProps) => {
  return (
    <FormField
      control={control}
      name="loan_purpose"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Loan Purpose *</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe the purpose of this loan in detail..."
              className="resize-none"
              rows={4}
              {...field}
            />
          </FormControl>
          <p className="text-sm text-muted-foreground">
            Please provide a detailed explanation of how the loan will be used
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};