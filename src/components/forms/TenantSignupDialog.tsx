import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTenantRegistration } from "@/hooks/useTenantRegistration";
import { useEmailOTP } from "@/hooks/useEmailOTP";
import { Building2, Mail, Shield, CheckCircle } from "lucide-react";

const tenantSignupSchema = z.object({
  // Tenant Details
  tenantName: z.string().min(2, "Organization name must be at least 2 characters"),
  
  // Admin User Details
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  
  // Organization Details
  country: z.string().min(1, "Please select a country"),
  currency: z.string().min(1, "Please select a currency"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TenantSignupForm = z.infer<typeof tenantSignupSchema>;

interface TenantSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TenantSignupDialog = ({ open, onOpenChange, onSuccess }: TenantSignupDialogProps) => {
  const [step, setStep] = useState<'form' | 'email-verification' | 'success'>('form');
  const [formData, setFormData] = useState<TenantSignupForm | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [createdTenant, setCreatedTenant] = useState<any>(null);
  
  const { sendOTP, verifyOTP } = useEmailOTP();
  const tenantRegistrationMutation = useTenantRegistration();

  const form = useForm<TenantSignupForm>({
    resolver: zodResolver(tenantSignupSchema),
    defaultValues: {
      tenantName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
      currency: "USD",
    },
  });

  const onSubmit = async (data: TenantSignupForm) => {
    setFormData(data);
    
    try {
      await sendOTP.mutateAsync({
        email: data.email,
        type: 'registration',
        tenantName: data.tenantName,
      });
      
      setStep('email-verification');
    } catch (error) {
      console.error("OTP sending error:", error);
    }
  };

  const handleOTPVerification = async () => {
    if (!formData || !otpCode) return;

    try {
      await verifyOTP.mutateAsync({
        email: formData.email,
        otpCode: otpCode,
      });

      // OTP verified, proceed with tenant registration
      const result = await tenantRegistrationMutation.mutateAsync({
        tenantName: formData.tenantName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        timezone: 'UTC',
        currency: formData.currency,
      });

      setCreatedTenant(result.tenant);
      setStep('success');
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleResendOTP = async () => {
    if (!formData) return;
    
    try {
      await sendOTP.mutateAsync({
        email: formData.email,
        type: 'registration',
        tenantName: formData.tenantName,
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData(null);
    setOtpCode("");
    setCreatedTenant(null);
    form.reset();
    onOpenChange(false);
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (step === 'email-verification') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-banking-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-banking-primary" />
            </div>
            <DialogTitle className="text-2xl text-banking-primary">Verify Your Email</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to <strong>{formData?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Enter the verification code to continue</span>
              </div>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleOTPVerification}
                disabled={otpCode.length !== 6 || verifyOTP.isPending || tenantRegistrationMutation.isPending}
              >
                {verifyOTP.isPending || tenantRegistrationMutation.isPending ? "Creating Account..." : "Verify & Create Account"}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResendOTP}
                disabled={sendOTP.isPending}
              >
                {sendOTP.isPending ? "Sending..." : "Resend Code"}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep('form')}
              >
                Back to Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <DialogTitle className="text-2xl text-banking-primary">Welcome to LoanSpur!</DialogTitle>
            <DialogDescription>
              Your organization "{createdTenant?.name}" has been created successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your organization details:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Organization:</strong> {createdTenant?.name}</p>
                <p><strong>Subdomain:</strong> {createdTenant?.subdomain}.loanspurcbs.com</p>
                <p><strong>Trial Period:</strong> 30 days</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your account is ready! You can now sign in to get started.
              </p>
              <Button 
                className="w-full" 
                onClick={handleSuccess}
              >
                Continue to Sign In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-banking-primary" />
            Start Your Free Trial
          </DialogTitle>
          <DialogDescription>
            Create your organization and admin account with a 30-day free trial
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-banking-primary" />
                <h3 className="text-lg font-semibold">Organization Details</h3>
              </div>
              
              <FormField
                control={form.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your organization name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Admin User Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin Account Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@yourorg.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="KE">Kenya</SelectItem>
                          <SelectItem value="UG">Uganda</SelectItem>
                          <SelectItem value="TZ">Tanzania</SelectItem>
                          <SelectItem value="NG">Nigeria</SelectItem>
                          <SelectItem value="GH">Ghana</SelectItem>
                          <SelectItem value="ZA">South Africa</SelectItem>
                          <SelectItem value="IN">India</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                          <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                          <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                          <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                          <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                          <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={form.formState.isSubmitting || sendOTP.isPending}
              >
                {form.formState.isSubmitting || sendOTP.isPending ? "Processing..." : "Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};