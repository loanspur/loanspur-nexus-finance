import { useState } from 'react';
import { LogOut, User, Settings, RefreshCw, Building2 } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatButton } from '@/components/chat/ChatButton';
import { PersonalProfileDialog } from '@/components/profile/PersonalProfileDialog';
import { BusinessSettingsDialog } from '@/components/profile/BusinessSettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';


export const UserMenu = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);

  if (!user || !profile) {
    return null;
  }

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      toast({
        title: "Profile Refreshed",
        description: "Your profile information has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInitials = () => {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleDisplay = () => {
    switch (profile.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'tenant_admin':
        return 'Tenant Admin';
      case 'loan_officer':
        return 'MFI User';
      case 'client':
        return 'Client';
      default:
        return 'User';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <ChatButton />
      <NotificationBell />
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || ''} alt={user.email || ''} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : user.email
              }
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleDisplay()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowBusinessDialog(true)}>
          <Building2 className="mr-2 h-4 w-4" />
          Business Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleRefreshProfile}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Profile'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    <PersonalProfileDialog 
      open={showProfileDialog} 
      onOpenChange={setShowProfileDialog} 
    />
    
    <BusinessSettingsDialog 
      open={showBusinessDialog} 
      onOpenChange={setShowBusinessDialog} 
    />
    </div>
  );
};