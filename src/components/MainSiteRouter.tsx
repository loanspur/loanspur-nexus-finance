import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import AuthPage from '@/pages/AuthPage';
import PricingPage from '@/pages/PricingPage';
import TenantRegistrationPage from '@/pages/TenantRegistrationPage';
import { AcceptInvitationPage } from '@/pages/AcceptInvitationPage';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import TenantLayout from '@/layouts/TenantLayout';
import ClientLayout from '@/layouts/ClientLayout';
import { useAuth } from '@/hooks/useAuth';

export const IndexRedirector = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Index /> : <Navigate to="/auth" replace />;
};

export const MainSiteRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirector />} />
      
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
        <Route path="/auth/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/register" element={<TenantRegistrationPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};