'use client';

import { useFrappeList } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function PractitionerDashboard() {
  const { practitionerId } = useAuth();
  const safeId = practitionerId || '';
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useFrappeList('Patient Appointment', [
    ['practitioner', '=', safeId],
    ['appointment_date', '=', today],
    ['status', 'in', ['Scheduled', 'Open']],
  ]);

  const appointments = data?.data || [];
  const completed = appointments.filter((a: any) => a.status === 'Closed').length;
  const pending = appointments.filter((a: any) => ['Scheduled', 'Open'].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{completed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">{pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {appointments.filter((a: any) => a.status === 'Cancelled').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h2>
          <Link href="/practitioner/appointments" className="text-sm text-blue-600 hover:text-blue-700">View All →</Link>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? <LoadingSpinner className="py-8" /> :
           appointments.length === 0 ? <p className="px-6 py-8 text-center text-gray-500">No appointments for today</p> :
           appointments.map((appt: any) => (
             <div key={appt.name} className="px-6 py-4 flex items-center justify-between">
               <div className="flex items-center space-x-4">
                 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                   {appt.patient_name?.charAt(0) || 'P'}
                 </div>
                 <div>
                   <p className="font-medium text-gray-900">{appt.patient_name}</p>
                   <p className="text-sm text-gray-500">{appt.appointment_time} | {appt.department}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-3">
                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                   appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                   appt.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                   appt.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                 }`}>{appt.status}</span>
                 <Link href={`/practitioner/encounters?patient=${appt.patient}&appointment=${appt.name}`}
                   className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Start</Link>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
