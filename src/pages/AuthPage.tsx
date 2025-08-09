import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, UserPlus, Key } from "lucide-react";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import heroImage from "@/assets/hero-banking.jpg";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(['client', 'loan_officer', 'tenant_admin'], {
    required_error: "Please select a role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface AuthPageProps {
  tenantMode?: boolean;
}

const AuthPage = ({ tenantMode = false }: AuthPageProps) => {
  const { signIn, signUp, resetPassword, user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: import.meta.env.DEV ? "justmurenga@gmail.com" : "",
      password: import.meta.env.DEV ? "password123" : "",
    },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "client",
    },
  });


  // Redirect authenticated users
  useEffect(() => {
    if (user && profile) {
      // Force super admin to their dashboard regardless of prior route
      if (profile.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
        return;
      }
      const from = location.state?.from?.pathname || getRoleBasedRoute(profile.role);
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, location]);

  const getRoleBasedRoute = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '/super-admin';
      case 'tenant_admin':
      case 'loan_officer':
        return '/tenant';
      case 'client':
        return '/client';
      default:
        return '/';
    }
  };

  const onSignIn = async (data: SignInForm) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      signInForm.reset();
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    const { error } = await signUp(data.email, data.password, {
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
    });
    if (!error) {
      setIsSignUpOpen(false);
      signUpForm.reset();
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isForgotPasswordOpen) {
    return (
      <ForgotPasswordDialog 
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={() => {
          setIsForgotPasswordOpen(false);
          // Optional: show success message or redirect to login
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-banking-primary/10 via-background to-banking-secondary/10" />

      <div className="w-full grid min-h-screen md:grid-cols-2 gap-8 lg:gap-12 items-center px-2 sm:px-4 lg:px-6">
        {/* Left showcase panel */}
        <aside className="relative hidden md:flex items-center justify-center p-6 lg:p-8 rounded-3xl ring-1 ring-border/50 overflow-hidden bg-card/40 backdrop-blur-md">
          <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-[var(--shadow-glow)]">
            <img
              src={heroImage}
              alt="Core banking platform illustration"
              className="h-full w-full object-cover object-center opacity-70"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/50" />
          </div>
          <div className="relative z-10 max-w-lg space-y-5 text-left">
            <p className="text-sm uppercase tracking-wide text-banking-primary/80">LoanSpur CBS</p>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight tracking-tight">Secure core banking login</h2>
            <p className="text-muted-foreground">
              Sign in to manage clients, loans, savings, and reconciliations with enterprise-grade security.
            </p>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-banking-primary" /> AI-driven analytics</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-banking-primary" /> Real-time dashboards</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-banking-primary" /> Role-based access</li>
            </ul>
          </div>
        </aside>

        {/* Right auth panel */}
        <main className="flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-[640px]">
            {!tenantMode && (
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-banking-primary mb-2">LoanSpur CBS</h1>
                <p className="text-base text-muted-foreground">Secure Financial Management Platform</p>
              </div>
            )}

            <Card className="rounded-3xl ring-1 ring-border/50 border border-border/60 bg-card/70 backdrop-blur-xl shadow-[var(--shadow-elegant)]">
              <CardHeader className="space-y-3 pb-4">
                <div className="text-left">
                  <CardTitle className="text-2xl font-bold">
                    {tenantMode ? "Welcome Back" : "Sign In"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {tenantMode ? "Access your account" : "Enter your credentials to continue"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-5">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Enter your email" 
                                className="pl-10 h-11 rounded-xl"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showSignInPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                className="pl-10 pr-10 h-11 rounded-xl"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowSignInPassword(!showSignInPassword)}
                              >
                                {showSignInPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-banking-primary hover:text-banking-primary/80 p-0 h-auto"
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Forgot password?
                      </Button>
                    </div>
                    
                    <Button 
                      className="w-full h-11 rounded-xl text-base font-semibold shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-[box-shadow] duration-300" 
                      type="submit" 
                      disabled={signInForm.formState.isSubmitting}
                    >
                      {signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>

                {!tenantMode && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">New to LoanSpur?</span>
                    </div>
                  </div>
                )}

                {!tenantMode && (
                  <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-11 rounded-xl text-base font-semibold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                        <DialogDescription>
                          Sign up for a new LoanSpur CBS account
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...signUpForm}>
                        <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={signUpForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="First name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={signUpForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Last name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={signUpForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="loan_officer">Loan Officer</SelectItem>
                                    <SelectItem value="tenant_admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showSignUpPassword ? "text" : "password"} 
                                      placeholder="Enter password" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                    >
                                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showConfirmPassword ? "text" : "password"} 
                                      placeholder="Confirm password" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            className="w-full" 
                            type="submit" 
                            disabled={signUpForm.formState.isSubmitting}
                          >
                            {signUpForm.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;