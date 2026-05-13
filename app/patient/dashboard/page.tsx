'use client';

import Link from 'next/link';
import { useLiveAppointments } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function PatientDashboard() {
  const { patientId, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading, error } = useLiveAppointments(patientId || '');

  const appointments = data?.data || [];
  const upcoming = appointments.filter((a: any) => a.status === 'Scheduled' || a.status === 'Confirmed');
  const isLoading = authLoading || dataLoading;

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard] patientId:', patientId);
    console.log('[Dashboard] data:', data);
    console.log('[Dashboard] error:', error);
    if (data?.data?.length > 0) {
      console.log('[Dashboard] First appointment:', data.data[0]);
      console.log('[Dashboard] Appointment statuses:', data.data.map((a: any) => a.status));
    }
  }, [patientId, data, error]);

  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666666]">No patient profile found.</p>
          <p className="text-sm text-[#6C7087] mt-1">Please contact support to link your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Dashboard</h1>
        <Link
          href="/patient/appointments"
          className="px-6 py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
        >
          Book Appointment
        </Link>
      </div>

      {error && (
        <div className="bg-[#FCE7EC] border border-[#E500BB]/20 text-[#001E42] px-4 py-3 text-sm" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
          Failed to load appointments. Please try again later.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-gray-100">
          <p className="text-sm font-medium text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Upcoming Appointments</p>
          <p className="mt-2 text-3xl font-semibold text-[#001E42]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>{upcoming.length}</p>
        </div>
        <div className="bg-white p-6 border border-gray-100">
          <p className="text-sm font-medium text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Total Appointments</p>
          <p className="mt-2 text-3xl font-semibold text-[#E500BB]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>{appointments.length}</p>
        </div>
        <div className="bg-white p-6 border border-gray-100">
          <p className="text-sm font-medium text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Next Visit</p>
          <p className="mt-2 text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
            {upcoming[0]?.appointment_date || 'No upcoming visits'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Recent Appointments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : appointments.length === 0 ? (
            <p className="px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No appointments found</p>
          ) : (
            appointments.slice(0, 5).map((appt: any) => (
              <div key={appt.name} className="px-6 py-4 flex items-center justify-between hover:bg-[#F4F7FA] transition-colors">
                <div>
                  <p className="font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.practitioner_name}</p>
                  <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_date}</p>
                  <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_time}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold ${
                  appt.status === 'Scheduled' ? 'bg-[#F2F8F5] text-[#001E42]' :
                  appt.status === 'Closed' ? 'bg-[#F2F8F5] text-[#001E42]' :
                  appt.status === 'Cancelled' ? 'bg-[#FCE7EC] text-[#E500BB]' :
                  'bg-[#F4F7FA] text-[#6C7087]'
                }`} style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                  {appt.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
