import { useState } from "react";
import { useAuth, Profile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Crown, Building, User, CreditCard } from "lucide-react";

interface UserProfile extends Profile {
  tenants?: {
    name: string;
  };
}

export const UserSwitcher = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const loadProfiles = async () => {
    if (profiles.length > 0) return; // Already loaded
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          tenants (
            name
          )
        `)
        .order('role', { ascending: true })
        .order('email', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load user profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToUser = async (targetProfile: UserProfile) => {
    if (targetProfile.id === profile?.id) return; // Already current user
    
    setIsSwitching(true);
    try {
      // Call the development function to get profile info
      const { data, error } = await supabase.rpc('dev_switch_user_context', {
        target_profile_id: targetProfile.id
      });
      
      if (error) throw error;
      
      // Store the target profile info in localStorage for development
      localStorage.setItem('dev_target_profile', JSON.stringify(data));
      
      toast({
        title: "Profile Switched",
        description: `Switched to ${targetProfile.first_name} ${targetProfile.last_name} (${targetProfile.role})`,
      });
      
      // Reload to apply the new context
      window.location.reload();
      
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'tenant_admin':
        return <Building className="h-4 w-4" />;
      case 'loan_officer':
        return <CreditCard className="h-4 w-4" />;
      case 'client':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'tenant_admin':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'loan_officer':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'client':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'loan_officer':
        return 'MFI User';
      case 'super_admin':
        return 'Super Admin';
      case 'tenant_admin':
        return 'Tenant Admin';
      case 'client':
        return 'Client';
      default:
        return role.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  // Only allow super admins to switch user profiles
  const canSwitch = profile?.role === 'super_admin';

  if (!canSwitch) return null;

  // Check if we're in development mode with a target profile
  const hasDevProfile = typeof window !== 'undefined' && localStorage.getItem('dev_target_profile') !== null;

  return (
    <>
      {hasDevProfile && (
        <div className="mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-orange-600 border-orange-200"
            onClick={() => {
              localStorage.removeItem('dev_target_profile');
              window.location.reload();
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Exit Dev Mode
          </Button>
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start"
          onClick={loadProfiles}
        >
          <Users className="h-4 w-4 mr-2" />
          Switch User Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Switch User Profile</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((userProfile) => (
              <Card 
                key={userProfile.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  profile?.id === userProfile.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => switchToUser(userProfile)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={userProfile.avatar_url || undefined} />
                      <AvatarFallback>
                        {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {userProfile.first_name} {userProfile.last_name}
                        </h4>
                        {profile?.id === userProfile.id && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {userProfile.email}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(userProfile.role)}>
                          {getRoleIcon(userProfile.role)}
                          <span className="ml-1">{formatRole(userProfile.role)}</span>
                        </Badge>
                        
                        {userProfile.tenants && (
                          <Badge variant="outline">
                            {userProfile.tenants.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Development Feature:</strong> This allows switching between user profiles for testing purposes. 
            The switch is temporary and will simulate the selected user's context until you exit dev mode.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};