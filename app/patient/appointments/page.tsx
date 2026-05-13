'use client';

import { useState } from 'react';
import { useLiveAppointments, useDoctorList, useFrappeCreate, usePractitionerSchedule, usePractitionerAppointments, useFrappeGetOne } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import PaymentSummary from '@/components/payment/PaymentSummary';

function getDayName(dateStr: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export default function PatientAppointments() {
  const { patientId, user } = useAuth();
  const patientName = user?.full_name || '';
  
  const { data: apptData, isLoading: apptLoading } = useLiveAppointments(patientId || '');
  const { data: doctorData, isLoading: doctorLoading } = useDoctorList();
  const createAppointment = useFrappeCreate('Patient Appointment');
  
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [form, setForm] = useState({
    practitioner: '',
    practitioner_name: '',
    department: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'General Consultation',
    notes: '',
  });

  // Fetch practitioner details to get their consultation fee
  const { data: practitionerDetail } = useFrappeGetOne('Healthcare Practitioner', form.practitioner);
  const practitionerData = practitionerDetail?.data || {};
  
  // Get consultation fee from practitioner (fallback to 500 if not set)
  const CONSULTATION_FEE = practitionerData.op_consulting_charge || practitionerData.consultation_charge || 500;

  const { data: scheduleData } = usePractitionerSchedule(form.practitioner);
  const { data: existingApptsData } = usePractitionerAppointments(form.practitioner, form.appointment_date);

  const appointments = apptData?.data || [];
  const doctors = doctorData?.data || [];

  // Compute available slots
  const schedule = scheduleData?.data;
  const existingAppts = existingApptsData?.data || [];
  const bookedTimes = new Set(existingAppts.map((a: any) => a.appointment_time));
  
  const availableSlots: { from_time: string; to_time: string; day: string }[] = [];
  if (schedule && form.appointment_date) {
    const dayName = getDayName(form.appointment_date);
    const slots = schedule.time_slots || [];
    slots.forEach((slot: any) => {
      if (slot.day === dayName && !bookedTimes.has(slot.from_time)) {
        availableSlots.push(slot);
      }
    });
  }

  function handleDoctorSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const doctor = doctors.find((d: any) => d.name === e.target.value);
    if (doctor) {
      setForm({
        ...form,
        practitioner: doctor.name,
        practitioner_name: doctor.practitioner_name,
        department: doctor.department,
        appointment_date: '',
        appointment_time: '',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Show payment summary instead of directly booking
    setShowPayment(true);
  }

  async function handlePay() {
    setIsPaying(true);
    try {
      // Encode appointment data into basket_id
      const appointmentData = {
        patient: patientId,
        patient_name: patientName,
        practitioner: form.practitioner,
        practitioner_name: form.practitioner_name,
        department: form.department,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        appointment_type: form.appointment_type,
        notes: form.notes,
        amount: CONSULTATION_FEE,
      };
      const paymentAmount = CONSULTATION_FEE.toFixed(2);

      // Generate short basket ID
      const basketId = `A${Date.now().toString(36).toUpperCase().slice(-8)}`;

      // Store appointment data via API
      await fetch('/api/payment/store-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          appointment_data: appointmentData,
        }),
      });

      // Get PayFast token
      const tokenRes = await fetch('/api/payment/payfast-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          amount: paymentAmount,
          currency_code: 'PKR',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.token) {
        throw new Error(tokenData.error || 'Failed to get payment token');
      }

      // Create and submit PayFast form
      // Match Python implementation exactly
      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = process.env.PAYFAST_POST_URL || 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';

      const fields: Record<string, string> = {
        MERCHANT_ID: tokenData.merchant_id.toString(),
        TOKEN: tokenData.token,
        BASKET_ID: basketId,
        TXNAMT: paymentAmount,
        CURRENCY_CODE: 'PKR',
        ORDER_DATE: new Date().toISOString().replace('T', ' ').slice(0, 19),
        TRAN_TYPE: 'ECOMM_PURCHASE',
        SUCCESS_URL: `${window.location.origin}/api/payment/payfast-success`,
        FAILURE_URL: `${window.location.origin}/payment/failed`,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        formEl.appendChild(input);
      });

      document.body.appendChild(formEl);
      formEl.submit();
      document.body.removeChild(formEl);
    } catch (err: any) {
      console.error('[PayFast] Payment error:', err);
      alert('Payment initiation failed: ' + err.message);
      setIsPaying(false);
    }
  }

  function handleBackToForm() {
    setShowPayment(false);
  }

  function resetForm() {
    setShowForm(false);
    setShowPayment(false);
    setForm({
      practitioner: '', practitioner_name: '', department: '',
      appointment_date: '', appointment_time: '', appointment_type: 'General Consultation', notes: '',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>My Appointments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
        >
          {showForm ? 'Cancel' : 'Book New Appointment'}
        </button>
      </div>

      {showForm && !showPayment && (
        <div className="bg-white p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Book Appointment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Select Doctor</label>
              <select required value={form.practitioner} onChange={handleDoctorSelect}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}>
                <option value="">Choose a doctor</option>
                {doctorLoading ? <option>Loading...</option> :
                  doctors.map((d: any) => (
                    <option key={d.name} value={d.name}>{d.practitioner_name} - {d.department}</option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Date</label>
                <input type="date" required value={form.appointment_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value, appointment_time: '' })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Time Slot</label>
                {form.practitioner && form.appointment_date ? (
                  availableSlots.length > 0 ? (
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.from_time}
                          type="button"
                          onClick={() => setForm({ ...form, appointment_time: slot.from_time })}
                          className={`px-3 py-2 text-sm border transition-colors ${
                            form.appointment_time === slot.from_time
                              ? 'bg-[#001E42] text-white border-[#001E42]'
                              : 'bg-white text-[#333333] border-gray-300 hover:bg-[#F4F7FA]'
                          }`}
                          style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
                        >
                          {formatTime(slot.from_time)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-[#E500BB]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No slots available for this date</p>
                  )
                ) : (
                  <p className="mt-1 text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Select a doctor and date first</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Type</label>
              <select value={form.appointment_type}
                onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}>
                <option>General Consultation</option>
                <option>Follow-up</option>
                <option>Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} rows={3} />
            </div>
            <button type="submit" disabled={createAppointment.isPending}
              className="px-6 py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] disabled:opacity-50 transition-colors"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              {createAppointment.isPending ? 'Booking...' : 'Review & Pay'}
            </button>
          </form>
        </div>
      )}

      {showPayment && (
        <PaymentSummary
          doctorName={form.practitioner_name}
          department={form.department}
          date={form.appointment_date}
          time={formatTime(form.appointment_time)}
          appointmentType={form.appointment_type}
          consultationFee={CONSULTATION_FEE}
          onPay={handlePay}
          onBack={handleBackToForm}
          isLoading={isPaying}
        />
      )}

      <div className="bg-white border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>All Appointments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {apptLoading ? <LoadingSpinner className="py-8" /> :
           appointments.length === 0 ? <p className="px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No appointments found</p> :
           appointments.map((appt: any) => (
             <Link key={appt.name} href={`/patient/appointments/${appt.name}`} className="block px-6 py-4 hover:bg-[#F4F7FA] transition-colors">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.practitioner_name}</p>
                   <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.department} | {appt.appointment_type}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_date}</p>
                   <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.appointment_time}</p>
                 </div>
                 <span className={`px-3 py-1 text-xs font-semibold ${
                   appt.status === 'Scheduled' ? 'bg-[#F2F8F5] text-[#001E42]' :
                   appt.status === 'Closed' ? 'bg-[#F2F8F5] text-[#001E42]' :
                   appt.status === 'Cancelled' ? 'bg-[#FCE7EC] text-[#E500BB]' :
                   'bg-[#F4F7FA] text-[#6C7087]'
                 }`} style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{appt.status}</span>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}
