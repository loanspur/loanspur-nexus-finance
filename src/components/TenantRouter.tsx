import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import TenantLayout from '@/layouts/TenantLayout';
import ClientLayout from '@/layouts/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Tenant subdomain landing page
const TenantLandingPage = () => {
  const { currentTenant } = useTenant();
  const { user, profile } = useAuth();

  if (user && profile) {
    // Redirect based on user role
    if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    } else if (profile.role === 'tenant_admin' || profile.role === 'loan_officer') {
      return <Navigate to="/tenant" replace />;
    }
    // For other roles or no role, stay on landing page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-primary/5 via-background to-banking-secondary/5 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="mb-4">
            {currentTenant?.logo_url && (
              <img 
                src={currentTenant.logo_url} 
                alt={`${currentTenant.name} logo`}
                className="h-16 w-16 mx-auto rounded-lg shadow-sm"
              />
            )}
          </div>
          <h1 className="text-3xl font-bold text-banking-primary mb-2">
            {currentTenant?.name}
          </h1>
          <p className="text-banking-secondary/80 font-medium">
            Secure Financial Management Platform
          </p>
        </div>
        
        <AuthPage tenantMode />
      </div>
    </div>
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
  console.log('TenantRouter - Debug Info:', {
    currentTenant,
    loading,
    error,
    isSubdomainTenant,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined'
  });

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