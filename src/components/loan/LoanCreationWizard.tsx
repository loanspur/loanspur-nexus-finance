import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Shield, 
  Users, 
  Upload, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { ClientSelectionStep } from "./wizard-steps/ClientSelectionStep";
import { LoanProductSelectionStep } from "./wizard-steps/LoanProductSelectionStep";
import { LoanDetailsStep } from "./wizard-steps/LoanDetailsStep";
import { EnhancedChargesAndFeesStep } from "./wizard-steps/EnhancedChargesAndFeesStep";
import { EnhancedCollateralDetailsStep } from "./wizard-steps/EnhancedCollateralDetailsStep";
import { GuarantorInformationStep } from "./wizard-steps/GuarantorInformationStep";
import { DocumentUploadStep } from "./wizard-steps/DocumentUploadStep";
import { ReviewAndSubmitStep } from "./wizard-steps/ReviewAndSubmitStep";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const loanCreationSchema = z.object({
  // Client Information
  client_id: z.string().min(1, "Client is required"),
  
  // Loan Product Information
  loan_product_id: z.string().min(1, "Loan product is required"),
  fund_source_id: z.string().min(1, "Fund source is required"),
  
  // Basic Loan Details
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1 month"),
  number_of_installments: z.number().min(1, "Number of installments required"),
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
  interest_rate: z.number().min(0, "Interest rate must be 0 or greater"),
  calculation_method: z.string().min(1, "Calculation method is required"),
  first_repayment_date: z.date().optional(),
  purpose: z.string().min(1, "Loan purpose is required"),
  
  // Charges and Fees
  selected_charges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    amount: z.number(),
    collected_on: z.string(),
    due_date: z.string().optional(),
  })).optional(),
  
  // Collateral Details
  collateral_type: z.string().optional(),
  collateral_value: z.number().min(0).optional(),
  collateral_description: z.string().optional(),
  
  // Guarantor Information
  guarantors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
    guarantee_amount: z.number(),
  })).optional(),
  
  // Document Upload
  required_documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    file_url: z.string(),
    document_type: z.string(),
  })).optional(),
  
  // Savings Account Link
  linked_savings_account_id: z.string().optional(),
  
  // Additional Fields
  external_id: z.string().optional(),
  loan_officer_id: z.string().optional(),
  expected_disbursement_date: z.date().optional(),
  grace_period_duration: z.number().min(0).optional(),
  grace_period_type: z.string().optional(),
});

type LoanCreationFormData = z.infer<typeof loanCreationSchema>;

const steps = [
  {
    id: 'client-selection',
    title: 'Client Selection',
    description: 'Select the client for this loan',
    icon: User,
    required: true,
  },
  {
    id: 'loan-product',
    title: 'Loan Product',
    description: 'Choose the loan product',
    icon: CreditCard,
    required: true,
  },
  {
    id: 'loan-details',
    title: 'Loan Details',
    description: 'Enter loan amount, term, and schedule',
    icon: DollarSign,
    required: true,
  },
  {
    id: 'charges-fees',
    title: 'Charges & Fees',
    description: 'Configure loan charges and fees',
    icon: FileText,
    required: false,
  },
  {
    id: 'collateral',
    title: 'Collateral',
    description: 'Add collateral information',
    icon: Shield,
    required: false,
  },
  {
    id: 'guarantors',
    title: 'Guarantors',
    description: 'Add guarantor information',
    icon: Users,
    required: false,
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required documents',
    icon: Upload,
    required: false,
  },
  {
    id: 'review-submit',
    title: 'Review & Submit',
    description: 'Review and submit the loan application',
    icon: CheckCircle,
    required: true,
  },
];

interface LoanCreationWizardProps {
  onApplicationCreated?: (applicationId: string) => void;
  onCancel?: () => void;
}

export function LoanCreationWizard({ onApplicationCreated, onCancel }: LoanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();

  const form = useForm<LoanCreationFormData>({
    resolver: zodResolver(loanCreationSchema),
    defaultValues: {
      selected_charges: [],
      guarantors: [],
      required_documents: [],
    },
  });

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    const isValid = await form.trigger(getFieldsForStep(currentStep));
    
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the current step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = form.getValues();
      
      const loanApplicationData = {
        client_id: formData.client_id,
        loan_product_id: formData.loan_product_id,
        fund_source_id: formData.fund_source_id,
        requested_amount: formData.requested_amount,
        requested_term: formData.requested_term,
        number_of_installments: formData.number_of_installments,
        repayment_frequency: formData.repayment_frequency,
        interest_rate: formData.interest_rate,
        calculation_method: formData.calculation_method,
        first_repayment_date: formData.first_repayment_date,
        purpose: formData.purpose,
        collateral_type: formData.collateral_type,
        collateral_value: formData.collateral_value,
        collateral_description: formData.collateral_description,
        linked_savings_account_id: formData.linked_savings_account_id,
        selected_charges: formData.selected_charges || [],
        status: 'pending' as const,
        loan_officer_id: formData.loan_officer_id || profile?.id,
        expected_disbursement_date: formData.expected_disbursement_date,
        grace_period_duration: formData.grace_period_duration,
        grace_period_type: formData.grace_period_type,
      };

      const result = await createLoanApplication.mutateAsync(loanApplicationData);
      
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
      
      if (onApplicationCreated) {
        onApplicationCreated(result.id);
      }
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to create loan application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldsForStep = (stepIndex: number): (keyof LoanCreationFormData)[] => {
    switch (stepIndex) {
      case 0: return ['client_id'];
      case 1: return ['loan_product_id', 'fund_source_id'];
      case 2: return ['requested_amount', 'requested_term', 'number_of_installments', 'repayment_frequency', 'interest_rate', 'calculation_method', 'purpose'];
      case 3: return [];
      case 4: return [];
      case 5: return [];
      case 6: return [];
      case 7: return [];
      default: return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ClientSelectionStep form={form} />;
      case 1:
        return <LoanProductSelectionStep form={form} />;
      case 2:
        return <LoanDetailsStep form={form} />;
      case 3:
        return <EnhancedChargesAndFeesStep form={form} />;
      case 4:
        return <EnhancedCollateralDetailsStep form={form} />;
      case 5:
        return <GuarantorInformationStep form={form} />;
      case 6:
        return <DocumentUploadStep form={form} />;
      case 7:
        return <ReviewAndSubmitStep form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Loan Application</h1>
        <p className="text-muted-foreground">Follow the step-by-step process to create a comprehensive loan application</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isAccessible = isCompleted || isCurrent;
          
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              disabled={!isAccessible}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                isCurrent
                  ? 'border-primary bg-primary/10 text-primary'
                  : isCompleted
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <step.icon className="w-4 h-4" />
                {step.required && <AlertCircle className="w-3 h-3 text-red-500" />}
                {isCompleted && <CheckCircle className="w-3 h-3 text-green-500" />}
              </div>
              <div className="text-xs font-medium">{step.title}</div>
            </button>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentStep === steps.length - 1 ? 'bg-green-100' : 'bg-primary/10'}`}>
              <currentStepData.icon className={`w-5 h-5 ${currentStep === steps.length - 1 ? 'text-green-600' : 'text-primary'}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepData.title}
                {currentStepData.required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}