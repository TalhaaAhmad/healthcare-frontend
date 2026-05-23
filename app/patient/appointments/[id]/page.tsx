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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <Link href="/patient/appointments" className="text-sm text-[#E500BB] hover:text-[#001E42] font-semibold transition-colors" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            &larr; Back to Appointments
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {canModify && (
            <>
              <button
                onClick={() => setShowReschedule(!showReschedule)}
                className="px-3 sm:px-4 py-2 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#c400a0] transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                Reschedule
              </button>
              <button
                onClick={handleCancel}
                disabled={updateAppointment.isPending}
                className="px-3 sm:px-4 py-2 bg-[#FCE7EC] text-[#E500BB] text-xs font-bold uppercase tracking-[2px] hover:bg-[#E500BB] hover:text-white transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                {updateAppointment.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          )}
          <span className={`px-2 sm:px-3 py-1 text-xs font-semibold ${
            appointment.status === 'Scheduled' ? 'bg-[#F2F8F5] text-[#001E42]' :
            appointment.status === 'Closed' ? 'bg-[#F2F8F5] text-[#001E42]' :
            appointment.status === 'Cancelled' ? 'bg-[#FCE7EC] text-[#E500BB]' :
            'bg-[#F4F7FA] text-[#6C7087]'
          }`} style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.status}</span>
        </div>
      </div>

      {/* Reschedule Form */}
      {showReschedule && canModify && (
        <div className="bg-white border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Reschedule Appointment</h2>
          <form onSubmit={handleReschedule} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>New Date</label>
              <input
                type="date"
                required
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>New Time</label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateAppointment.isPending}
                className="px-3 sm:px-4 py-2 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#c400a0] disabled:opacity-50 transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                {updateAppointment.isPending ? 'Saving...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="px-3 sm:px-4 py-2 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-[#333333] hover:bg-[#333333] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Info Card */}
      <div className="bg-white border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Appointment Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Doctor</p>
            <p className="text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.practitioner_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Department</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.department}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Date</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.appointment_date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Time</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{formatTime(appointment.appointment_time)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Type</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.appointment_type}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Duration</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.duration} min</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Patient</p>
            <p className="text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.patient_name}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-[#6C7087] uppercase" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Notes</p>
            <p className="text-sm text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointment.notes || '—'}</p>
          </div>
        </div>
      </div>

      {/* Encounter Section */}
      <div className="bg-white border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Consultation / Encounter</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {encLoading ? <LoadingSpinner className="py-8" /> :
           encounters.length === 0 ? (
             <p className="px-4 sm:px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
               No encounter yet. The doctor will create one after your visit.
             </p>
           ) : encounters.map((enc: any) => (
             <EncounterDetailCard key={enc.name} encounterName={enc.name} />
           ))}
        </div>
      </div>

      {/* Lab Tests Section */}
      <div className="bg-white border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Lab Tests</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {labLoading ? <LoadingSpinner className="py-8" /> :
           labTests.length === 0 ? (
             <p className="px-4 sm:px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>No lab tests ordered for this appointment</p>
           ) : labTests.map((test: any) => (
             <div key={test.name} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
               <div>
                 <p className="font-medium text-sm sm:text-base text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{test.template}</p>
                 <p className="text-xs sm:text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{test.date}</p>
               </div>
               <span className={`px-2 sm:px-3 py-1 text-xs font-semibold self-start sm:self-auto ${
                 test.status === 'Completed' ? 'bg-[#F2F8F5] text-[#001E42]' :
                 test.status === 'Open' ? 'bg-[#F4F7FA] text-[#001E42]' : 'bg-[#F4F7FA] text-[#6C7087]'
               }`} style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{test.status}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
