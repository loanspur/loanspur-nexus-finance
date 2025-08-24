import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import TenantLayout from '@/layouts/TenantLayout';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ClientLayout from '@/layouts/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Tenant subdomain landing page
const TenantLandingPage = () => {
  const { currentTenant } = useTenant();
  const { user, profile } = useAuth();

  if (user && profile) {
    // Redirect based on user role
    if (profile.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    } else if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    } else if (profile.role === 'tenant_admin' || profile.role === 'loan_officer') {
      return <Navigate to="/tenant" replace />;
    }
    // For other roles or no role, stay on landing page
  }

  return (
    <AuthPage tenantMode />
  );
};

// Error page for invalid tenant
const TenantNotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/10 flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <h1 className="text-3xl font-bold text-destructive mb-4">
          Tenant Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          The organization you're looking for doesn't exist or is not available.
        </p>
        <p className="text-sm text-muted-foreground">
          Please contact your administrator for access.
        </p>
      </div>
    </div>
  );
};

export const TenantRouter = () => {
  const { currentTenant, loading, error, isSubdomainTenant } = useTenant();

  // Debug logging
  if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {
  console.log('TenantRouter - Debug Info:', {
    currentTenant,
    loading,
    error,
    isSubdomainTenant,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined'
  });
}

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle tenant subdomain errors
  if (isSubdomainTenant && (error || !currentTenant)) {
    return <TenantNotFoundPage />;
  }

  // Routes for tenant subdomains
  if (isSubdomainTenant && currentTenant) {
    return (
      <Routes>
        <Route path="/" element={<TenantLandingPage />} />
        <Route path="/auth" element={<TenantLandingPage />} />
        
        {/* Super admin routes */}
        <Route 
          path="/super-admin/*" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          } 
        />
        
        {/* Tenant admin routes */}
        <Route 
          path="/tenant/*" 
          element={
            <ProtectedRoute allowedRoles={['tenant_admin', 'loan_officer']}>
              <TenantLayout />
            </ProtectedRoute>
          } 
        />
        
        {/* Client routes */}
        <Route 
          path="/client/*" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to root to show login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // This should not render for tenant subdomains, but just in case
  return null;
};