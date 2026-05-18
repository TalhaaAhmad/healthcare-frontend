'use client';

import { useLiveAppointments } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function PatientAppointments() {
  const { patientId } = useAuth();

  const { data: apptData, isLoading: apptLoading } = useLiveAppointments(patientId || '');
  const appointments = apptData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>My Appointments</h1>
        <Link
          href="/patient/appointments/book"
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
        >
          Book New Appointment
        </Link>
      </div>

      <div className="bg-white border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>All Appointments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {apptLoading ? <LoadingSpinner className="py-8" /> :
           appointments.length === 0 ? <p className="px-4 sm:px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No appointments found</p> :
           appointments.map((appt: any) => (
             <Link key={appt.name} href={`/patient/appointments/${appt.name}`} className="block px-4 sm:px-6 py-4 hover:bg-[#F4F7FA] transition-colors">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                 <div>
                   <p className="font-medium text-sm sm:text-base text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.practitioner_name}</p>
                   <p className="text-xs sm:text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.department} | {appt.appointment_type}</p>
                 </div>
                 <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                   <div className="text-left sm:text-right">
                     <p className="text-xs sm:text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_date}</p>
                     <p className="text-xs sm:text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_time}</p>
                   </div>
                   <span className={`px-2 sm:px-3 py-1 text-xs font-semibold ${
                     appt.status === 'Scheduled' ? 'bg-[#F2F8F5] text-[#001E42]' :
                     appt.status === 'Closed' ? 'bg-[#F2F8F5] text-[#001E42]' :
                     appt.status === 'Cancelled' ? 'bg-[#FCE7EC] text-[#E500BB]' :
                     'bg-[#F4F7FA] text-[#6C7087]'
                   }`} style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.status}</span>
                 </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}
