'use client';

import { useParams } from 'next/navigation';
import { useFrappeGetOne, useFrappeList, useFrappeUpdate, useFrappeSetValue, useFrappeCancel, useFrappeSave, usePatientAppointmentUpdateStatus } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

// Fetch full encounter details with child tables (symptoms, diagnosis, prescriptions)
function EncounterDetailCard({ encounterName }: { encounterName: string }) {
  const { data, isLoading } = useFrappeGetOne('Patient Encounter', encounterName);
  const enc = data?.data || {};

  // Fetch practitioner name separately
  const { data: practitionerData } = useFrappeGetOne('Healthcare Practitioner', enc.practitioner);
  const practitionerName = practitionerData?.data?.practitioner_name || enc.practitioner;

  if (isLoading) return <LoadingSpinner className="py-4" />;

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-gray-900">Dr. {practitionerName}</p>
          <p className="text-sm text-gray-500">{enc.encounter_date}</p>
          {enc.symptoms?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Symptoms</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {enc.symptoms.map((s: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
                    {s.complaint}
                  </span>
                ))}
              </div>
            </div>
          )}
          {enc.diagnosis?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diagnosis</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {enc.diagnosis.map((d: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-red-50 text-red-800 text-xs rounded-md border border-red-200">
                    {d.diagnosis}
                  </span>
                ))}
              </div>
            </div>
          )}
          {enc.drug_prescription?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prescriptions</p>
              <div className="mt-2 space-y-2">
                {enc.drug_prescription.map((pres: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pres.drug_name || pres.drug_code}</p>
                      <p className="text-xs text-gray-500">{pres.dosage} | {pres.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ml-4 ${
          enc.status === 'Open' ? 'bg-blue-100 text-blue-800' :
          enc.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>{enc.status}</span>
      </div>
    </div>
  );
}

export default function AppointmentDetail() {
  const params = useParams();
  const appointmentId = params.id as string;
  const router = useRouter();

  const { data: apptData, isLoading: apptLoading } = useFrappeGetOne('Patient Appointment', appointmentId);
  const appointment = apptData?.data;

  const updateAppointment = useFrappeUpdate('Patient Appointment');
  const setAppointmentValue = useFrappeSetValue('Patient Appointment');
  const cancelAppointment = useFrappeCancel('Patient Appointment');
  const saveAppointment = useFrappeSave('Patient Appointment');
  const updateStatus = usePatientAppointmentUpdateStatus();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Fetch encounter linked to this appointment (just names, details fetched by child component)
  const { data: encounterData, isLoading: encLoading } = useFrappeList('Patient Encounter', [
    ['appointment', '=', appointmentId],
  ], ['name']);
  const encounters = encounterData?.data || [];

  // Fetch lab tests linked to this patient
  const { data: labData, isLoading: labLoading } = useFrappeList('Lab Test', [
    ['patient', '=', appointment?.patient],
  ], ['name', 'template', 'date', 'status']);
  const labTests = labData?.data || [];

  const canModify = appointment?.status === 'Scheduled';

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      // Use Healthcare module's update_status method
      await updateStatus.mutateAsync({
        appointmentId,
        status: 'Cancelled',
      });
      console.log('[Cancel] Appointment cancelled successfully');
      window.location.reload();
    } catch (err: any) {
      console.error('[Cancel] Error:', err);
      alert('Failed to cancel appointment: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    await updateAppointment.mutateAsync({
      name: appointmentId,
      data: { appointment_date: newDate, appointment_time: newTime },
    });
    setShowReschedule(false);
  }

  if (apptLoading) return <LoadingSpinner className="py-12" />;
  if (!appointment) return <p className="text-center text-gray-500 py-12">Appointment not found</p>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patient/appointments" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Appointments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Appointment Details</h1>
        </div>
        <div className="flex items-center gap-3">
          {canModify && (
            <>
              <button
                onClick={() => setShowReschedule(!showReschedule)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Reschedule
              </button>
              <button
                onClick={handleCancel}
                disabled={updateAppointment.isPending}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {updateAppointment.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          )}
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
            appointment.status === 'Closed' ? 'bg-green-100 text-green-800' :
            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>{appointment.status}</span>
        </div>
      </div>

      {/* Reschedule Form */}
      {showReschedule && canModify && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reschedule Appointment</h2>
          <form onSubmit={handleReschedule} className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Date</label>
              <input
                type="date"
                required
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Time</label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateAppointment.isPending}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {updateAppointment.isPending ? 'Saving...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointment Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Doctor</p>
            <p className="text-sm font-medium text-gray-900">{appointment.practitioner_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Department</p>
            <p className="text-sm text-gray-900">{appointment.department}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
            <p className="text-sm text-gray-900">{appointment.appointment_date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Time</p>
            <p className="text-sm text-gray-900">{formatTime(appointment.appointment_time)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
            <p className="text-sm text-gray-900">{appointment.appointment_type}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
            <p className="text-sm text-gray-900">{appointment.duration} min</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
            <p className="text-sm text-gray-900">{appointment.notes || '—'}</p>
          </div>
        </div>
      </div>

      {/* Encounter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Consultation / Encounter</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {encLoading ? <LoadingSpinner className="py-8" /> :
           encounters.length === 0 ? (
             <p className="px-6 py-8 text-center text-gray-500">
               No encounter yet. The doctor will create one after your visit.
             </p>
           ) : encounters.map((enc: any) => (
             <EncounterDetailCard key={enc.name} encounterName={enc.name} />
           ))}
        </div>
      </div>

      {/* Lab Tests Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lab Tests</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {labLoading ? <LoadingSpinner className="py-8" /> :
           labTests.length === 0 ? (
             <p className="px-6 py-8 text-center text-gray-500">No lab tests ordered for this appointment</p>
           ) : labTests.map((test: any) => (
             <div key={test.name} className="px-6 py-4 flex justify-between items-center">
               <div>
                 <p className="font-medium text-gray-900">{test.template}</p>
                 <p className="text-sm text-gray-500">{test.date}</p>
               </div>
               <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                 test.status === 'Completed' ? 'bg-green-100 text-green-800' :
                 test.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
               }`}>{test.status}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
