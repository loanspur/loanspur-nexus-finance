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
import { ChevronLeft, ChevronRight, User, FileText, Building, CreditCard, Users, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Step Components
import { KYCInformationStep } from "./steps/KYCInformationStep";
import { UniqueIdentifiersStep } from "./steps/UniqueIdentifiersStep";
import { BankingInformationStep } from "./steps/BankingInformationStep";
import { EmploymentInformationStep } from "./steps/EmploymentInformationStep";
import { BusinessInformationStep } from "./steps/BusinessInformationStep";
import { NextOfKinStep } from "./steps/NextOfKinStep";
import { DocumentUploadStep } from "./steps/DocumentUploadStep";
import { SavingsAccountStep } from "./steps/SavingsAccountStep";

const clientOnboardingSchema = z.object({
  // KYC Information
  client_number: z.string().min(1, "Client number is required"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  place_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  
  // Unique Identifiers
  national_id: z.string().optional(),
  passport_number: z.string().optional(),
  driving_license_number: z.string().optional(),
  
  // Banking Information
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_branch: z.string().optional(),
  
  // Employment Information
  occupation: z.string().optional(),
  employer_name: z.string().optional(),
  employer_address: z.string().optional(),
  job_title: z.string().optional(),
  employment_start_date: z.string().optional(),
  monthly_income: z.string().optional(),
  
  // Business Information
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  business_registration_number: z.string().optional(),
  business_address: z.string().optional(),
  
  // Next of Kin Information
  next_of_kin_name: z.string().optional(),
  next_of_kin_relationship: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
  next_of_kin_email: z.string().optional(),
  next_of_kin_address: z.string().optional(),
  
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
  { id: 'kyc', title: 'KYC Information', icon: User, description: 'Basic personal information' },
  { id: 'identifiers', title: 'Unique Identifiers', icon: FileText, description: 'ID numbers and documents' },
  { id: 'banking', title: 'Banking Information', icon: CreditCard, description: 'Bank account details' },
  { id: 'employment', title: 'Employment Information', icon: Building, description: 'Work and income details' },
  { id: 'business', title: 'Business Information', icon: Building, description: 'Business details (if applicable)' },
  { id: 'next_of_kin', title: 'Next of Kin', icon: Users, description: 'Emergency contact information' },
  { id: 'documents', title: 'Document Upload', icon: Upload, description: 'Upload required documents' },
  { id: 'savings', title: 'Savings Account', icon: CheckCircle, description: 'Create savings account' },
];

export const ClientOnboardingForm = ({ open, onOpenChange }: ClientOnboardingFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const { toast } = useToast();
  const { profile } = useAuth();

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
      passport_number: "",
      driving_license_number: "",
      bank_name: "",
      bank_account_number: "",
      bank_branch: "",
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
      next_of_kin_name: "",
      next_of_kin_relationship: "",
      next_of_kin_phone: "",
      next_of_kin_email: "",
      next_of_kin_address: "",
      create_savings_account: false,
      savings_product_id: "",
      initial_deposit: "",
    },
  });

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

  const onSubmit = async (data: ClientOnboardingData) => {
    setIsSubmitting(true);
    try {
      // Transform data for API
      const clientData = {
        tenant_id: profile?.tenant_id,
        client_number: data.client_number,
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        place_of_birth: data.place_of_birth || null,
        nationality: data.nationality || null,
        gender: data.gender || null,
        address: data.address ? { street: data.address } : null,
        national_id: data.national_id || null,
        passport_number: data.passport_number || null,
        driving_license_number: data.driving_license_number || null,
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
        next_of_kin_name: data.next_of_kin_name || null,
        next_of_kin_relationship: data.next_of_kin_relationship || null,
        next_of_kin_phone: data.next_of_kin_phone || null,
        next_of_kin_email: data.next_of_kin_email || null,
        next_of_kin_address: data.next_of_kin_address || null,
        kyc_status: 'completed',
        approval_status: 'pending',
        is_active: false, // Will be activated after approval
        timely_repayment_rate: 0,
        profile_picture_url: null,
        mifos_client_id: null,
      };

      // Here you would call your API to create the client
      console.log('Creating client with data:', clientData);
      console.log('Savings account requested:', data.create_savings_account);
      console.log('Uploaded documents:', uploadedDocuments);

      toast({
        title: "Success",
        description: "Client onboarding completed successfully. Pending approval.",
      });

      form.reset();
      setCurrentStep(0);
      setUploadedDocuments([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to complete client onboarding",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepId = steps[currentStep].id;
    const commonProps = { form, nextStep, prevStep };

    switch (stepId) {
      case 'kyc':
        return <KYCInformationStep {...commonProps} />;
      case 'identifiers':
        return <UniqueIdentifiersStep {...commonProps} />;
      case 'banking':
        return <BankingInformationStep {...commonProps} />;
      case 'employment':
        return <EmploymentInformationStep {...commonProps} />;
      case 'business':
        return <BusinessInformationStep {...commonProps} />;
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
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
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

        <div className="flex gap-6 overflow-hidden">
          {/* Left Sidebar - Step Navigation */}
          <div className="w-80 flex-shrink-0 space-y-2 overflow-y-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : isCompleted 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <Form {...form}>
              <div className="flex-1 overflow-y-auto">
                {/* Current Step */}
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
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

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t bg-background">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
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
                    className="bg-success hover:bg-success/90"
                  >
                    {isSubmitting ? "Submitting..." : "Complete Onboarding"}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
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