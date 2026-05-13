'use client';

import { useState } from 'react';
import { useFrappeList, useFrappeUpdate } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function PractitionerAppointments() {
  const { practitionerId } = useAuth();
  const safeId = practitionerId || '';
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useFrappeList('Patient Appointment', [
    ['practitioner', '=', safeId],
    ['appointment_date', '=', dateFilter],
  ]);

  const updateAppointment = useFrappeUpdate('Patient Appointment');
  const appointments = data?.data || [];

  async function updateStatus(name: string, status: string) {
    await updateAppointment.mutateAsync({ name, data: { status } });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Appointments for {dateFilter}</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? <LoadingSpinner className="py-8" /> :
           appointments.length === 0 ? <p className="px-6 py-8 text-center text-gray-500">No appointments found</p> :
           appointments.map((appt: any) => (
             <div key={appt.name} className="px-6 py-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                   <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                     {appt.patient_name?.charAt(0) || 'P'}
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">{appt.patient_name}</p>
                     <p className="text-sm text-gray-500">{appt.appointment_time} | {appt.department} | {appt.appointment_type}</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                     appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                     appt.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                     appt.status === 'Closed' ? 'bg-green-100 text-green-800' :
                     appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                   }`}>{appt.status}</span>
                   {appt.status === 'Scheduled' && (
                     <>
                       <button onClick={() => updateStatus(appt.name, 'Open')}
                         className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Start</button>
                       <button onClick={() => updateStatus(appt.name, 'Cancelled')}
                         className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
                     </>
                   )}
                   {appt.status === 'Open' && (
                     <>
                       <Link href={`/practitioner/encounters?patient=${appt.patient}&appointment=${appt.name}`}
                         className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Consult</Link>
                       <button onClick={() => updateStatus(appt.name, 'Closed')}
                         className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Complete</button>
                     </>
                   )}
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
