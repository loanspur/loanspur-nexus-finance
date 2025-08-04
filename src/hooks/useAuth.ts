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
  avatar_url?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  isRole: (role: UserRole) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
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
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user ?? null }));
        
        if (session?.user) {
          // Fetch user profile with timeout to avoid blocking
          setTimeout(async () => {
            try {
              // Check if current user is super admin and has dev profile set
              const { data: currentProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
              
              // Remove any dev profile switching for strict super admin isolation
              const devProfile = localStorage.getItem('dev_target_profile');
              if (devProfile) {
                localStorage.removeItem('dev_target_profile');
                console.log('Dev profile switching disabled for strict role separation');
              }
              
              // Normal profile loading - only get active profiles
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single();
              
              if (error) {
                console.error('Error fetching profile:', error);
                toast({
                  title: "Profile Error",
                  description: "Could not load user profile",
                  variant: "destructive",
                });
              } else {
                setState(prev => ({ ...prev, profile, loading: false }));
              }
            } catch (error) {
              console.error('Profile fetch error:', error);
              setState(prev => ({ ...prev, loading: false }));
            }
          }, 0);
        } else {
          setState(prev => ({ ...prev, profile: null, loading: false }));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null, loading: false }));
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData?: Partial<Profile>) => {
    setState(prev => ({ ...prev, loading: true }));
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      }
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setState({ user: null, session: null, profile: null, loading: false });
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      // Check if current user is super admin and has dev profile set
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', state.user.id)
        .single();
      
      // Remove any dev profile switching for strict super admin isolation
      const devProfile = localStorage.getItem('dev_target_profile');
      if (devProfile) {
        localStorage.removeItem('dev_target_profile');
        console.log('Dev profile switching disabled for strict role separation');
      }
      
      // Normal profile loading - only get active profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', state.user.id)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Profile Error",
          description: "Could not load user profile",
          variant: "destructive",
        });
      } else {
        setState(prev => ({ ...prev, profile, loading: false }));
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Reset Password Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    }

    return { error };
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
    isRole,
    hasRole,
  };
};

export { AuthContext };