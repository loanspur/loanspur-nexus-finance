import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle, User, FileText, CreditCard, Building, Users, Upload, Save } from "lucide-react";

interface ReviewStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
  formData: any;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ReviewStep = ({ formData, onSubmit, isSubmitting }: ReviewStepProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return 'Not provided';
    return `KES ${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Review Your Information</h3>
      </div>

      {/* KYC Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Client Number:</span>
              <p className="text-sm text-muted-foreground">{formData.client_number || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Full Name:</span>
              <p className="text-sm text-muted-foreground">
                {[formData.first_name, formData.middle_name, formData.last_name].filter(Boolean).join(' ') || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>
              <p className="text-sm text-muted-foreground">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Phone:</span>
              <p className="text-sm text-muted-foreground">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Date of Birth:</span>
              <p className="text-sm text-muted-foreground">{formatDate(formData.date_of_birth)}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Gender:</span>
              <p className="text-sm text-muted-foreground">{formData.gender || 'Not provided'}</p>
            </div>
          </div>
          {formData.address && (
            <div>
              <span className="text-sm font-medium">Address:</span>
              <p className="text-sm text-muted-foreground">{formData.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Identification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.selected_identifier_type ? (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Identifier Type:</span>
                <Badge variant="outline" className="ml-2">
                  {formData.selected_identifier_type?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">Number:</span>
                <p className="text-sm text-muted-foreground">
                  {formData[formData.selected_identifier_type] || 'Not provided'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No identification provided</p>
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      {(formData.bank_name || formData.bank_account_number) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Bank Name:</span>
                <p className="text-sm text-muted-foreground">{formData.bank_name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Account Number:</span>
                <p className="text-sm text-muted-foreground">{formData.bank_account_number || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Branch:</span>
                <p className="text-sm text-muted-foreground">{formData.bank_branch || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Source */}
      {formData.income_source_type && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Income Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Type:</span>
              <Badge variant="outline" className="ml-2 capitalize">
                {formData.income_source_type}
              </Badge>
            </div>
            
            {formData.income_source_type === 'employment' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Occupation:</span>
                  <p className="text-sm text-muted-foreground">{formData.occupation || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Job Title:</span>
                  <p className="text-sm text-muted-foreground">{formData.job_title || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Employer:</span>
                  <p className="text-sm text-muted-foreground">{formData.employer_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Start Date:</span>
                  <p className="text-sm text-muted-foreground">{formatDate(formData.employment_start_date)}</p>
                </div>
              </div>
            )}

            {formData.income_source_type === 'business' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Business Name:</span>
                  <p className="text-sm text-muted-foreground">{formData.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Business Type:</span>
                  <p className="text-sm text-muted-foreground">{formData.business_type || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Registration Number:</span>
                  <p className="text-sm text-muted-foreground">{formData.business_registration_number || 'Not provided'}</p>
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium">Monthly Income:</span>
              <p className="text-sm text-muted-foreground">{formatCurrency(formData.monthly_income)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next of Kin */}
      {formData.next_of_kin && formData.next_of_kin.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Next of Kin ({formData.next_of_kin.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.next_of_kin.map((contact: any, index: number) => (
              <div key={index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Contact {index + 1}:</span>
                    <Badge variant="secondary">{contact.relationship}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Name:</span>
                      <p className="text-sm text-muted-foreground">{contact.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Phone:</span>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                    {contact.email && (
                      <div>
                        <span className="text-sm font-medium">Email:</span>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Savings Account */}
      {formData.create_savings_account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Savings Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Savings account will be created</span>
              </div>
              {formData.initial_deposit && (
                <div>
                  <span className="text-sm font-medium">Initial Deposit:</span>
                  <p className="text-sm text-muted-foreground">{formatCurrency(formData.initial_deposit)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              By submitting this form, I confirm that all information provided is accurate and complete.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                size="lg"
                className="bg-success hover:bg-success/90 flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Complete Onboarding & Submit Application"}
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};