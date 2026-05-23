'use client';

import { useUserAppointments } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

function formatDateDMY(dateStr: string) {
  if (!dateStr) return '';
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Scheduled':
      return 'bg-[#FFF8E1] text-[#F5A623] border border-[#F5A623]';
    case 'Open':
      return 'bg-[#FFF3E0] text-[#E65100] border border-[#E65100]';
    case 'Cancelled':
      return 'bg-[#FCE7EC] text-[#E500BB] border border-[#E500BB]';
    case 'Closed':
      return 'bg-[#F2F8F5] text-[#001E42] border border-[#001E42]';
    default:
      return 'bg-[#F4F7FA] text-[#6C7087] border border-[#6C7087]';
  }
}

export default function PatientAppointments() {
  const { user } = useAuth();

  const { data: apptData, isLoading: apptLoading } = useUserAppointments(user?.email || '');
  const appointments = apptData?.data || [];

  return (
    <div className="space-y-6">
      <div></div>

      <div className="bg-white border border-gray-100">
        {apptLoading ? (
          <LoadingSpinner className="py-8" />
        ) : appointments.length === 0 ? (
          <p className="px-4 sm:px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            No appointments found
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F4F7FA] border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                      Title
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Department</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Time</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#6C7087] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((appt: any) => (
                    <tr key={appt.name} className="hover:bg-[#F4F7FA] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/patient/appointments/${appt.name}`}
                          className="text-sm font-medium text-[#333333] hover:text-[#001E42] transition-colors"
                          style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
                        >
                          {appt.title || `${appt.patient_name || appt.patient} with ${appt.practitioner_name}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-sm ${getStatusStyle(appt.status)}`} style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#333333] whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#333333] whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {formatDateDMY(appt.appointment_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#333333] whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.patient_name || appt.patient}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#333333] whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.appointment_time}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6C7087] whitespace-nowrap" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {appointments.map((appt: any) => (
                <Link
                  key={appt.name}
                  href={`/patient/appointments/${appt.name}`}
                  className="block px-4 py-4 hover:bg-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#333333] truncate" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.title || `${appt.patient_name || appt.patient} with ${appt.practitioner_name}`}
                      </p>
                      <p className="text-xs text-[#6C7087] mt-0.5" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        {appt.department}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                          {formatDateDMY(appt.appointment_date)}
                        </span>
                        <span className="text-xs text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                          {appt.appointment_time}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-sm shrink-0 ${getStatusStyle(appt.status)}`} style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                      {appt.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
