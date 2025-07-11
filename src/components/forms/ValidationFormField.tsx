import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type?: "text" | "email" | "phone" | "date" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  disabled?: boolean;
  guidelines?: string[];
  className?: string;
}

export const ValidationFormField = ({
  form,
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  options = [],
  rows = 3,
  disabled = false,
  guidelines = [],
  className
}: ValidationFormFieldProps) => {
  const fieldState = form.getFieldState(name);
  const hasError = !!fieldState.error;

  const getInputType = () => {
    switch (type) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  const getFieldGuidelines = () => {
    const defaultGuidelines: Record<string, string[]> = {
      email: ["Must be a valid email format (e.g., user@example.com)"],
      phone: ["Include country code (e.g., +254700000000)", "Must be 10-15 digits"],
      date: ["Select a valid date", "Date of birth should be in the past"],
      first_name: ["Must be at least 2 characters", "Only letters and spaces allowed"],
      last_name: ["Must be at least 2 characters", "Only letters and spaces allowed"],
      national_id: ["Must be exactly 8 digits", "Only numbers allowed"],
      passport_number: ["Must be 6-12 characters", "Letters and numbers only"],
      bank_account_number: ["Must be 10-16 digits", "Only numbers allowed"]
    };

    return guidelines.length > 0 ? guidelines : (defaultGuidelines[name] || []);
  };

  const renderInput = (field: any) => {
    const inputClassName = cn(
      hasError && "border-destructive ring-destructive focus:ring-destructive",
      className
    );

    switch (type) {
      case "select":
        return (
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger className={inputClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        );
      default:
        return (
          <Input
            type={getInputType()}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        );
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={hasError ? "animate-shake" : ""}>
          <FormLabel className={cn(
            hasError && "text-destructive",
            "flex items-center gap-1"
          )}>
            {label} {required && <span className="text-destructive">*</span>}
            {hasError && <AlertCircle className="h-3 w-3" />}
          </FormLabel>
          <FormControl>
            {renderInput(field)}
          </FormControl>
          
          {/* Error Message */}
          <FormMessage className="flex items-start gap-1">
            {hasError && <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
          </FormMessage>
          
          {/* Guidelines */}
          {(hasError || guidelines.length > 0) && (
            <div className={cn(
              "text-xs rounded-md p-2 mt-1",
              hasError ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted/50 text-muted-foreground"
            )}>
              <div className="flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">
                    {hasError ? "Please fix the following:" : "Guidelines:"}
                  </p>
                  <ul className="space-y-0.5">
                    {getFieldGuidelines().map((guideline, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-[10px] mt-0.5">•</span>
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </FormItem>
      )}
    />
  );
};