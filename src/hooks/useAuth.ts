import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'super_admin' | 'tenant_admin' | 'loan_officer' | 'client';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  tenant_id?: string;
  is_active: boolean;
  custom_role_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  isRole: (role: UserRole) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        setState(prev => ({ ...prev, session, user: session?.user ?? null, error: null }));
        
        if (session?.user) {
          // Fetch user profile with timeout to avoid blocking
          setTimeout(async () => {
            try {
              // Get user profile with proper error handling
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .maybeSingle();
              
              if (error) {
                console.error('Profile fetch error:', error);
                setState(prev => ({ 
                  ...prev, 
                  error: 'Failed to load user profile',
                  loading: false 
                }));
                return;
              }
              
              if (!profile) {
                console.warn('No active profile found for user:', session.user.id);
                setState(prev => ({ 
                  ...prev, 
                  error: 'No active profile found',
                  loading: false 
                }));
                return;
              }
              
              // Ensure proper typing
              const adjustedProfile = profile.role === 'super_admin' 
                ? { ...profile, tenant_id: undefined } 
                : profile;
              
              setState(prev => ({ 
                ...prev, 
                profile: adjustedProfile as Profile, 
                loading: false,
                error: null
              }));
              
            } catch (error) {
              console.error('Profile fetch error:', error);
              setState(prev => ({ 
                ...prev, 
                error: 'Failed to load user profile',
                loading: false 
              }));
            }
          }, 100); // Small delay to ensure auth is fully established
        } else {
          setState(prev => ({ 
            ...prev, 
            profile: null, 
            loading: false,
            error: null
          }));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session check error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to check session',
          loading: false 
        }));
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        session, 
        user: session?.user ?? null, 
        loading: false 
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Profile will be loaded by the auth state change listener
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast({
        title: "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: Partial<Profile>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData,
        }
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
      
      setState(prev => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', state.user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Could not load user profile',
          loading: false 
        }));
        return;
      }
      
      if (!profile) {
        console.warn('No active profile found for user:', state.user.id);
        setState(prev => ({ 
          ...prev, 
          error: 'No active profile found',
          loading: false 
        }));
        return;
      }
      
      const adjustedProfile = profile.role === 'super_admin' 
        ? { ...profile, tenant_id: undefined } 
        : profile;
      
      setState(prev => ({ 
        ...prev, 
        profile: adjustedProfile as Profile, 
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Profile fetch error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to refresh profile',
        loading: false 
      }));
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.profile?.id) {
      return { error: { message: 'No profile to update' } };
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.profile.id);
      
      if (error) {
        toast({
          title: "Update Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      // Refresh profile to get updated data
      await refreshProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message || 'Failed to update profile',
        variant: "destructive",
      });
      return { error };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.user?.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        return { error: { message: 'Current password is incorrect' } };
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        toast({
          title: "Password Change Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Password Change Error",
        description: error.message || 'Failed to change password',
        variant: "destructive",
      });
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Reset Password Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Reset Password Error",
        description: error.message || 'Failed to send reset email',
        variant: "destructive",
      });
      return { error };
    }
  };

  const isRole = (role: UserRole): boolean => {
    return state.profile?.role === role;
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return state.profile ? roles.includes(state.profile.role) : false;
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    updateProfile,
    changePassword,
    isRole,
    hasRole,
  };
};

export { AuthContext };