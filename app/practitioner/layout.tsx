'use client';

import { PageLayout } from '@/components/ui/PageLayout';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';

const practitionerNavItems = [
  { label: 'Dashboard', href: '/practitioner/dashboard', icon: '📊' },
  { label: 'Appointments', href: '/practitioner/appointments', icon: '📅' },
  { label: 'Patients', href: '/practitioner/patients', icon: '🧑' },
  { label: 'Encounters', href: '/practitioner/encounters', icon: '📝' },
];

export default function PractitionerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['Healthcare Practitioner', 'Practitioner']}>
      <PageLayout navItems={practitionerNavItems} portalName="Practitioner Portal">
        {children}
      </PageLayout>
    </ProtectedRoute>
  );
}
