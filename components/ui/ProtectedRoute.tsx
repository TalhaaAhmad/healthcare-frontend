'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, patientId, practitionerId } = useAuth();

  useEffect(() => {
    console.log('[ProtectedRoute] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'patientId:', patientId, 'practitionerId:', practitionerId);
  }, [isLoading, isAuthenticated, patientId, practitionerId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[ProtectedRoute] Redirecting to login — not authenticated');
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles) {
      const isPatient = patientId || user?.roles?.includes('Patient');
      const isPractitioner = practitionerId || user?.roles?.includes('Healthcare Practitioner') || user?.roles?.includes('Practitioner');

      const hasAccess = allowedRoles.some((role) => {
        if (role === 'Patient') return isPatient;
        if (role === 'Healthcare Practitioner' || role === 'Practitioner') return isPractitioner;
        return user?.roles?.includes(role);
      });

      if (!hasAccess) {
        console.log('[ProtectedRoute] Redirecting to login — no portal access');
        window.location.href = '/login';
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, user, patientId, practitionerId]);

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
    const isPractitioner = practitionerId || user?.roles?.includes('Healthcare Practitioner') || user?.roles?.includes('Practitioner');
    const hasAccess = allowedRoles.some((role) => {
      if (role === 'Patient') return isPatient;
      if (role === 'Healthcare Practitioner' || role === 'Practitioner') return isPractitioner;
      return user?.roles?.includes(role);
    });
    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}
