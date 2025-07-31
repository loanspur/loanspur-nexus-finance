import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import AuthPage from '@/pages/AuthPage';
import PricingPage from '@/pages/PricingPage';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import TenantLayout from '@/layouts/TenantLayout';
import ClientLayout from '@/layouts/ClientLayout';

export const MainSiteRouter = () => {
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
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};