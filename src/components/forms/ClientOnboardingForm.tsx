import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, User, FileText, Building, CreditCard, Users, Upload, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateClient } from "@/hooks/useSupabase";

// Step Components
import { KYCInformationStep } from "./steps/KYCInformationStep";
import { BankingInformationStep } from "./steps/BankingInformationStep";
import { EmploymentBusinessStep } from "./steps/EmploymentBusinessStep";
import { NextOfKinStep } from "./steps/NextOfKinStep";
import { DocumentUploadStep } from "./steps/DocumentUploadStep";
import { SavingsAccountStep } from "./steps/SavingsAccountStep";
import { ReviewStep } from "./steps/ReviewStep";

// Enhanced validation schema
const clientOnboardingSchema = z.object({
  // KYC Information (client_number will be auto-generated)
  client_number: z.string().optional(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, "Invalid phone number format"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  place_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  
  // National ID (moved to KYC section and made required)
  national_id: z.string().min(1, "National ID is required").regex(/^[0-9]{8}$/, "National ID must be 8 digits"),
  account_opening_date: z.string().min(1, "Account opening date is required"),
  passport_number: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[A-Z0-9]{6,12}$/.test(val);
  }, "Invalid passport number format"),
  driving_license_number: z.string().optional(),
  
  // Office and Loan Officer Assignment
  office_id: z.string().min(1, "Office selection is required"),
  loan_officer_id: z.string().optional(),
  
  // Banking Information
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[0-9]{10,16}$/.test(val);
  }, "Bank account number must be 10-16 digits"),
  bank_branch: z.string().optional(),
  
  // Employment/Business Information
  income_source_type: z.enum(["employment", "business"]).optional(),
  
  // Employment fields
  occupation: z.string().optional(),
  employer_name: z.string().optional(),
  employer_address: z.string().optional(),
  job_title: z.string().optional(),
  employment_start_date: z.string().optional(),
  monthly_income: z.string().optional(),
  
  // Business fields
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  business_registration_number: z.string().optional(),
  business_address: z.string().optional(),
  
  // Next of Kin Information (array support) - All fields optional
  next_of_kin: z.array(z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    email: z.union([
      z.string().email("Invalid email format"),
      z.literal("")
    ]).optional(),
    address: z.string().optional(),
  })).default([]),
  
  // Savings Account
  create_savings_account: z.boolean().default(false),
  savings_product_id: z.string().optional(),
  initial_deposit: z.string().optional(),
});

type ClientOnboardingData = z.infer<typeof clientOnboardingSchema>;

interface ClientOnboardingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 'kyc', title: 'KYC Information', icon: User, description: 'Personal details' },
  { id: 'banking', title: 'Banking Information', icon: CreditCard, description: 'Bank details' },
  { id: 'employment_business', title: 'Income Source', icon: Building, description: 'Income details' },
  { id: 'next_of_kin', title: 'Next of Kin', icon: Users, description: 'Emergency contact' },
  { id: 'documents', title: 'Document Upload', icon: Upload, description: 'Upload documents' },
  { id: 'savings', title: 'Savings Account', icon: CheckCircle, description: 'Account setup' },
  { id: 'review', title: 'Review', icon: Eye, description: 'Review details' },
];

export const ClientOnboardingForm = ({ open, onOpenChange }: ClientOnboardingFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const { toast } = useToast();
  const { profile } = useAuth();
  const createClientMutation = useCreateClient();

  // Generate unique client number
  const generateClientNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `CLI${timestamp}${random}`;
  };

  const form = useForm<ClientOnboardingData>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      client_number: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      place_of_birth: "",
      nationality: "",
      gender: "",
      address: "",
      national_id: "",
      account_opening_date: "",
      passport_number: "",
      driving_license_number: "",
      bank_name: "",
      bank_account_number: "",
      bank_branch: "",
      income_source_type: undefined,
      occupation: "",
      employer_name: "",
      employer_address: "",
      job_title: "",
      employment_start_date: "",
      monthly_income: "",
      business_name: "",
      business_type: "",
      business_registration_number: "",
      business_address: "",
      next_of_kin: [],
      create_savings_account: false,
      savings_product_id: "",
      initial_deposit: "",
    },
  });

  // Auto-generate client number when form opens
  React.useEffect(() => {
    if (open && !form.getValues('client_number')) {
      const newClientNumber = generateClientNumber();
      form.setValue('client_number', newClientNumber);
    }
  }, [open, form]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to get user-friendly field labels
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      first_name: "First Name",
      last_name: "Last Name", 
      email: "Email",
      phone: "Phone Number",
      date_of_birth: "Date of Birth",
      selected_identifier_type: "Identifier Type",
      national_id: "National ID",
      passport_number: "Passport Number", 
      driving_license_number: "Driving License",
      occupation: "Occupation",
      employer_name: "Employer Name",
      business_name: "Business Name",
      business_type: "Business Type"
    };
    return labels[fieldName] || fieldName.replace(/_/g, ' ');
  };

  const validateCurrentStep = async () => {
    const stepId = steps[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (stepId) {
      case 'kyc':
        fieldsToValidate = ['first_name', 'last_name', 'phone', 'date_of_birth', 'national_id', 'account_opening_date'];
        break;
      case 'employment_business':
        const incomeType = form.getValues('income_source_type');
        if (!incomeType) {
          toast({
            title: "Income Source Required",
            description: "Select employment or business",
            variant: "destructive",
          });
          return false;
        }
        if (incomeType === 'employment') {
          fieldsToValidate = ['occupation', 'employer_name'];
        } else if (incomeType === 'business') {
          fieldsToValidate = ['business_name', 'business_type'];
        }
        break;
      case 'next_of_kin':
        // Next of kin is now optional - no validation required
        break;
    }

    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate as any);
      if (!result) {
        // Get specific field errors with detailed messages
        const errors = form.formState.errors;
        const errorMessages: string[] = [];
        
        fieldsToValidate.forEach(fieldName => {
          const error = errors[fieldName];
          if (error) {
            const fieldLabel = getFieldLabel(fieldName);
            errorMessages.push(`${fieldLabel}: ${error.message}`);
          }
        });
        
        toast({
          title: "Please Fix These Errors",
          description: errorMessages.length > 0 ? errorMessages.join(" • ") : "Please correct the highlighted fields",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
    }
  };

  const onSubmit = async (data: ClientOnboardingData) => {
    setIsSubmitting(true);
    try {
      // Transform data for API
      const clientData = {
        tenant_id: profile?.tenant_id,
        client_number: data.client_number,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        place_of_birth: data.place_of_birth || null,
        nationality: data.nationality || null,
        gender: data.gender || null,
        address: data.address ? { street: data.address } : null,
        national_id: data.national_id,
        passport_number: data.passport_number || null,
        driving_license_number: data.driving_license_number || null,
        office_id: data.office_id,
        loan_officer_id: data.loan_officer_id || null,
        bank_name: data.bank_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_branch: data.bank_branch || null,
        occupation: data.occupation || null,
        employer_name: data.employer_name || null,
        employer_address: data.employer_address || null,
        job_title: data.job_title || null,
        employment_start_date: data.employment_start_date || null,
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
        business_name: data.business_name || null,
        business_type: data.business_type || null,
        business_registration_number: data.business_registration_number || null,
        business_address: data.business_address || null,
        // Store first next of kin in main fields for compatibility
        next_of_kin_name: data.next_of_kin[0]?.name || null,
        next_of_kin_relationship: data.next_of_kin[0]?.relationship || null,
        next_of_kin_phone: data.next_of_kin[0]?.phone || null,
        next_of_kin_email: data.next_of_kin[0]?.email || null,
        next_of_kin_address: data.next_of_kin[0]?.address || null,
        kyc_status: 'completed',
        approval_status: 'pending',
        is_active: false,
        timely_repayment_rate: 0,
        profile_picture_url: null,
        mifos_client_id: null,
      };

      // Create the client in the database
      console.log('Creating client with data:', clientData);
      await createClientMutation.mutateAsync(clientData);
      console.log('Client created successfully');

      // Show success message
      toast({
        title: "Client Created Successfully",
        description: `Client ${data.first_name} ${data.last_name} has been created and is pending approval. The client will need to be approved and then activated before they can access services.`,
        variant: "default",
      });

      // TODO: Handle additional features if needed
      // - Save additional next of kin contacts (beyond the first one)
      // - Create savings account if requested
      // - Upload documents to storage and link to client

      form.reset();
      setCurrentStep(0);
      setUploadedDocuments([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating client:", error);
      
      // Handle unique constraint violation for national_id
      if (error?.message?.includes('clients_national_id_unique') || 
          error?.message?.includes('duplicate key') ||
          error?.code === '23505') {
        toast({
          title: "Duplicate National ID",
          description: "This National ID number is already registered in the system. Please verify the number or contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to complete client onboarding",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepId = steps[currentStep].id;
    const commonProps = { form, nextStep: handleNext, prevStep };

    switch (stepId) {
      case 'kyc':
        return <KYCInformationStep {...commonProps} />;
      case 'banking':
        return <BankingInformationStep {...commonProps} />;
      case 'employment_business':
        return <EmploymentBusinessStep {...commonProps} />;
      case 'next_of_kin':
        return <NextOfKinStep {...commonProps} />;
      case 'documents':
        return (
          <DocumentUploadStep 
            {...commonProps} 
            uploadedDocuments={uploadedDocuments}
            setUploadedDocuments={setUploadedDocuments}
          />
        );
      case 'savings':
        return (
          <SavingsAccountStep 
            {...commonProps} 
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        );
      case 'review':
        return (
          <ReviewStep 
            {...commonProps} 
            formData={form.getValues()}
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">Client Onboarding</DialogTitle>
          
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex gap-6 h-[70vh]">
          {/* Left Sidebar - Step Navigation */}
          <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : isCompleted 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-primary-foreground/20' 
                      : isCompleted 
                        ? 'bg-green-100' 
                        : 'bg-background'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm mb-1 ${
                      isActive ? 'text-primary-foreground' : isCompleted ? 'text-green-700' : 'text-foreground'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs leading-relaxed ${
                      isActive ? 'text-primary-foreground/80' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {step.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
            <Form {...form}>
              <div className="flex-1 overflow-y-auto pr-2 max-h-[55vh]">
                {/* Current Step */}
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                      {steps[currentStep].title}
                    </CardTitle>
                    <CardDescription>
                      {steps[currentStep].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {renderStep()}
                  </CardContent>
                </Card>
              </div>

              {/* Navigation Buttons - Fixed at bottom */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t bg-background flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {currentStep + 1} / {steps.length}
                  </Badge>
                </div>

                {currentStep === steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-success hover:bg-success/90 flex items-center gap-2"
                  >
                    {isSubmitting ? "Submitting..." : "Complete Onboarding"}
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};