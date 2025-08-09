import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAssignUserToOffice } from "@/hooks/useUserInvitations";
import { getBaseDomain } from "@/utils/tenant";

const setPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetPasswordForm = z.infer<typeof setPasswordSchema>;

interface InvitationData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id: string;
  tenant?: {
    name: string;
    logo_url?: string;
    subdomain?: string;
  };
}

export const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutateAsync: assignUserToOffice } = useAssignUserToOffice();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = searchParams.get('token');

  const form = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from('user_invitations')
          .select(`
            *,
            tenant:tenants!inner(name, logo_url, subdomain)
          `)
          .eq('invitation_token', token)
          .eq('used', false)
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error("Error fetching invitation:", error);
          setError("Failed to load invitation");
          return;
        }

        if (!data) {
          setError("Invalid or expired invitation");
          return;
        }

        setInvitation(data);
      } catch (err) {
        console.error("Exception fetching invitation:", err);
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const onSubmit = async (data: SetPasswordForm) => {
    if (!invitation || !token) return;

    try {
      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
          options: {
            data: {
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              role: invitation.role,
              tenant_id: invitation.tenant_id,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ 
          used: true, 
          accepted_at: new Date().toISOString() 
        })
        .eq('invitation_token', token);

      if (updateError) {
        console.warn("Failed to mark invitation as used:", updateError);
      }

      toast({
        title: "Account Created Successfully",
        description: "Your account has been created successfully. Redirecting to login...",
      });

      // Redirect to tenant-specific auth page
      const tenantSubdomain = invitation.tenant?.subdomain;
      
      setTimeout(() => {
        if (tenantSubdomain) {
          window.location.href = `https://${tenantSubdomain}.${getBaseDomain()}/auth`;;
        } else {
          const currentSubdomain = window.location.hostname.split('.')[0];
          const isSubdomain = window.location.hostname.includes('.') && currentSubdomain !== 'www';
          
          if (isSubdomain) {
            window.location.href = `${window.location.origin}/auth`;
          } else {
            navigate('/auth');
          }
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Failed to Create Account",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-background to-destructive/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              {error || "This invitation link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleDisplayName = invitation.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/10 via-background to-banking-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            
            {invitation.tenant?.logo_url && (
              <img 
                src={invitation.tenant.logo_url} 
                alt={`${invitation.tenant.name} logo`}
                className="h-12 w-12 mx-auto rounded-lg"
              />
            )}
            
            <div>
              <CardTitle className="text-2xl font-bold">
                Welcome to {invitation.tenant?.name}!
              </CardTitle>
              <CardDescription className="mt-2">
                Complete your account setup to get started
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Account Details</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Name:</span> {invitation.first_name} {invitation.last_name}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {invitation.email}</p>
                <p className="text-sm"><span className="font-medium">Role:</span> {roleDisplayName}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter a secure password" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
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
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Confirm your password" 
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
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};