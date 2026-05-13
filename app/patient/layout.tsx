'use client';

import { PageLayout } from '@/components/ui/PageLayout';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';

const patientNavItems = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: '📊' },
  { label: 'Appointments', href: '/patient/appointments', icon: '📅' },
  { label: 'Doctors', href: '/patient/doctors', icon: '👨‍⚕️' },
  { label: 'Medical Records', href: '/patient/medical-records', icon: '📋' },
  { label: 'Profile', href: '/patient/profile', icon: '👤' },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['Patient']}>
      <PageLayout navItems={patientNavItems} portalName="Patient Portal">
        {children}
      </PageLayout>
    </ProtectedRoute>
  );
}
