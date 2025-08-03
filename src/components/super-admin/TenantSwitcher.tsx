import { useState } from 'react';
import { Building2, ChevronDown, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTenantSwitching } from '@/contexts/TenantSwitchingContext';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

export const TenantSwitcher = () => {
  const { profile } = useAuth();
  const {
    availableTenants,
    selectedTenant,
    isLoading,
    switchToTenant,
    switchToSuperAdmin,
    refreshTenants,
  } = useTenantSwitching();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for super admins
  if (profile?.role !== 'super_admin') return null;

  const handleTenantSelect = (tenant: any) => {
    switchToTenant(tenant);
    setIsOpen(false);
  };

  const handleSuperAdminSwitch = () => {
    switchToSuperAdmin();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 min-w-[200px] justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            {selectedTenant ? (
              <>
                <Building2 className="h-4 w-4" />
                <span className="truncate">{selectedTenant.name}</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>Super Admin</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          Switch Context
          <Badge variant="secondary" className="text-xs">
            Dev Mode
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Super Admin Option */}
        <DropdownMenuItem
          onClick={handleSuperAdminSwitch}
          className={`flex items-center space-x-2 ${!selectedTenant ? 'bg-accent' : ''}`}
        >
          <Users className="h-4 w-4" />
          <span>Super Admin</span>
          {!selectedTenant && <Badge variant="outline" className="ml-auto text-xs">Current</Badge>}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Available Tenants ({availableTenants.length})
        </DropdownMenuLabel>
        
        {/* Tenant List */}
        <ScrollArea className="max-h-60">
          {availableTenants.length === 0 ? (
            <DropdownMenuItem disabled className="text-center text-muted-foreground">
              No tenants available
            </DropdownMenuItem>
          ) : (
            availableTenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant)}
                className={`flex items-center space-x-2 ${
                  selectedTenant?.id === tenant.id ? 'bg-accent' : ''
                }`}
              >
                <Building2 className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tenant.subdomain || tenant.slug}
                  </div>
                </div>
                {selectedTenant?.id === tenant.id && (
                  <Badge variant="outline" className="text-xs">Current</Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => refreshTenants()}
          disabled={isLoading}
          className="text-xs text-muted-foreground"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Tenants'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};