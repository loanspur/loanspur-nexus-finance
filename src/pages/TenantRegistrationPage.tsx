import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantRegistration } from "@/hooks/useTenantRegistration";
import { useToast } from "@/hooks/use-toast";
import { Home, Building2, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const tenantRegistrationSchema = z.object({
  // Tenant Details
  tenantName: z.string().min(2, "Organization name must be at least 2 characters"),
  
  // Admin User Details
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  
  // Organization Details
  contactPersonPhone: z.string().optional(),
  country: z.string().min(1, "Please select a country"),
  timezone: z.string().min(1, "Please select a timezone"),
  currency: z.string().min(1, "Please select a currency"),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TenantRegistrationForm = z.infer<typeof tenantRegistrationSchema>;

const TenantRegistrationPage = () => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdTenant, setCreatedTenant] = useState<any>(null);
  const tenantRegistrationMutation = useTenantRegistration();
  const navigate = useNavigate();

  const form = useForm<TenantRegistrationForm>({
    resolver: zodResolver(tenantRegistrationSchema),
    defaultValues: {
      tenantName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      contactPersonPhone: "",
      country: "",
      timezone: "UTC",
      currency: "USD",
      city: "",
      stateProvince: "",
      postalCode: "",
    },
  });

  const onSubmit = async (data: TenantRegistrationForm) => {
    try {
      const result = await tenantRegistrationMutation.mutateAsync({
        tenantName: data.tenantName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        contactPersonPhone: data.contactPersonPhone,
        country: data.country,
        timezone: data.timezone,
        currency: data.currency,
        city: data.city,
        stateProvince: data.stateProvince,
        postalCode: data.postalCode,
      });

      setCreatedTenant(result.tenant);
      setStep('success');
    } catch (error) {
      // Error handling is already done in the hook
      console.error("Registration error:", error);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-banking-primary/10 via-background to-banking-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl text-banking-primary">Welcome to LoanSpur!</CardTitle>
            <CardDescription>
              Your organization "{createdTenant?.name}" has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Please check your email and verify your account to get started.
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/auth')}
              >
                Continue to Sign In
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/10 via-background to-banking-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 relative">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-0 right-0"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-banking-primary mr-3" />
            <h1 className="text-3xl font-bold text-banking-primary">Start Your Free Trial</h1>
          </div>
          <p className="text-muted-foreground">Create your organization and admin account to get started</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-xl text-center">Create Your Organization</CardTitle>
            <CardDescription className="text-center">
              Set up your LoanSpur organization with a 30-day free trial
            </CardDescription>
          </CardHeader>
          <CardContent>
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

                  <FormField
                    control={form.control}
                    name="contactPersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Location & Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location & Settings</h3>
                  
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
                              <SelectItem value="AU">Australia</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                              <SelectItem value="Europe/London">London (GMT)</SelectItem>
                              <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                              <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                              <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                              <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                              <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                              <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stateProvince"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state/province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={tenantRegistrationMutation.isPending}
                    className="min-w-[140px]"
                  >
                    {tenantRegistrationMutation.isPending ? "Creating..." : "Start Free Trial"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantRegistrationPage;