import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import { useDataOptimization } from '@/hooks/useOptimizedQueries';
import { getCurrentSubdomain } from '@/utils/tenant';
import AuthPage from '@/pages/AuthPage';
import TenantLayout from '@/layouts/TenantLayout';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ClientLayout from '@/layouts/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import PricingPage from '@/pages/PricingPage';
import TenantRegistrationPage from '@/pages/TenantRegistrationPage';
import { AcceptInvitationPage } from '@/pages/AcceptInvitationPage';

// Enhanced 404 handling component
const EnhancedNotFound = () => {
  const location = useLocation();
  const { isSubdomainTenant } = useTenant();
  
  // Log 404 for debugging
  console.warn('404 Error:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    isSubdomainTenant,
    timestamp: new Date().toISOString()
  });
  
  return <NotFound />;
};

// Unified landing page component
const LandingPage = () => {
  const { user, profile } = useAuth();
  const { currentTenant, isSubdomainTenant } = useTenant();

  // If user is authenticated, redirect based on role
  if (user && profile) {
    if (profile.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    } else if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    } else if (profile.role === 'tenant_admin' || profile.role === 'loan_officer') {
      return <Navigate to="/tenant" replace />;
    }
  }

  // For tenant subdomains, show tenant-specific auth
  if (isSubdomainTenant) {
    return <AuthPage tenantMode />;
  }

  // For main site, show main landing page
  return <Index />;
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

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const AppRouter = () => {
  const { currentTenant, loading, error, isSubdomainTenant } = useTenant();
  const subdomain = getCurrentSubdomain();

  // Initialize data optimization
  useDataOptimization();

  // Debug logging in development
  if (import.meta.env.VITE_IS_DEVELOPMENT === 'true') {
    console.log('AppRouter - Debug Info:', {
      currentTenant,
      loading,
      error,
      isSubdomainTenant,
      subdomain,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'undefined'
    });
  }

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle tenant subdomain errors
  if (isSubdomainTenant && (error || !currentTenant)) {
    return <TenantNotFoundPage />;
  }

  return (
    <Routes>
      {/* Root route - handles both main site and tenant subdomains */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Authentication routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/accept-invitation" element={<AcceptInvitationPage />} />
      
      {/* Tenant-specific auth route */}
      {isSubdomainTenant && (
        <Route path="/auth" element={<AuthPage tenantMode />} />
      )}
      
      {/* Super Admin Routes - available on both main site and tenant subdomains */}
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Tenant Admin Routes - available on both main site and tenant subdomains */}
      <Route 
        path="/tenant/*" 
        element={
          <ProtectedRoute allowedRoles={['tenant_admin', 'loan_officer']}>
            <TenantLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Client Routes - available on both main site and tenant subdomains */}
      <Route 
        path="/client/*" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Public Routes - only available on main site */}
      {!isSubdomainTenant && (
        <>
          <Route path="/register" element={<TenantRegistrationPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </>
      )}
      
      {/* Enhanced 404 handling */}
      <Route path="*" element={<EnhancedNotFound />} />
    </Routes>
  );
};
