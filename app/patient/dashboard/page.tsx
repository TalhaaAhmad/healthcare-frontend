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
          <p className="text-gray-500">No patient profile found.</p>
          <p className="text-sm text-gray-400 mt-1">Please contact support to link your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/patient/appointments"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Book Appointment
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to load appointments. Please try again later.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{upcoming.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Appointments</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Next Visit</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {upcoming[0]?.appointment_date || 'No upcoming visits'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : appointments.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-500">No appointments found</p>
          ) : (
            appointments.slice(0, 5).map((appt: any) => (
              <div key={appt.name} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{appt.practitioner_name}</p>
                  <p className="text-sm text-gray-500">{appt.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{appt.appointment_date}</p>
                  <p className="text-sm text-gray-500">{appt.appointment_time}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                  appt.status === 'Closed' ? 'bg-green-100 text-green-800' :
                  appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
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
