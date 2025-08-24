import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  }

  return <AuthPage tenantMode />;
};

// Error page for invalid tenant
const TenantNotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold text-destructive">Tenant Not Found</h1>
      <p className="text-muted-foreground">
        The requested tenant subdomain does not exist or is not accessible.
      </p>
      <a 
        href="/" 
        className="text-primary hover:underline"
      >
        Return to main site
      </a>
    </div>
  </div>
);

export const AppRouter = () => {
  const { currentTenant, loading, error, isSubdomainTenant } = useTenant();
  const subdomain = getCurrentSubdomain();
  const isSubdomainTenantCheck = !!subdomain;

  useDataOptimization();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle tenant subdomain errors
  if (isSubdomainTenantCheck && (error || !currentTenant)) {
    return <TenantNotFoundPage />;
  }

  // Routes for tenant subdomains
  if (isSubdomainTenantCheck && currentTenant) {
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

  // Main site routes (non-subdomain)
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Tenant Admin Routes */}
      <Route 
        path="/tenant/*" 
        element={
          <ProtectedRoute allowedRoles={['tenant_admin', 'loan_officer']}>
            <TenantLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Client Routes */}
      <Route 
        path="/client/*" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Public Routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/tenant/login" element={<AuthPage tenantMode />} />
      <Route path="/auth/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/register" element={<TenantRegistrationPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
