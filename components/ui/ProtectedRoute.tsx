'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, patientId } = useAuth();

  useEffect(() => {
    console.log('[ProtectedRoute] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'patientId:', patientId);
  }, [isLoading, isAuthenticated, patientId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[ProtectedRoute] Redirecting to login — not authenticated');
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles) {
      const isPatient = patientId || user?.roles?.includes('Patient');

      const hasAccess = allowedRoles.some((role) => {
        if (role === 'Patient') return isPatient;
        return user?.roles?.includes(role);
      });

      if (!hasAccess) {
        console.log('[ProtectedRoute] Redirecting to login — no portal access');
        window.location.href = '/login';
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, user, patientId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles) {
    const isPatient = patientId || user?.roles?.includes('Patient');
    const hasAccess = allowedRoles.some((role) => {
      if (role === 'Patient') return isPatient;
      return user?.roles?.includes(role);
    });
    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}
