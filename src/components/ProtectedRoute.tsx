import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { useTenantSwitching } from '@/contexts/TenantSwitchingContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/auth',
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  
  // Check if super admin is in tenant switching mode
  const { selectedTenant } = useTenantSwitching();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Super admins in tenant switching mode can access any route
  const isSuperAdminSwitching = profile.role === 'super_admin' && selectedTenant;
  
  if (allowedRoles && !allowedRoles.includes(profile.role) && !isSuperAdminSwitching) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes = {
      super_admin: '/super-admin',
      tenant_admin: '/tenant',
      loan_officer: '/tenant',
      client: '/client',
    };
    
    return <Navigate to={roleRoutes[profile.role]} replace />;
  }

  return <>{children}</>;
};